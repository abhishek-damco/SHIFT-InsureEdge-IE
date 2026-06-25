const { Router } = require('express')
const pool = require('../db/pool')

const router = Router()

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

// Generate next user_code: IE + 4-digit number
async function generateUserCode() {
  const { rows } = await pool.query(
    `SELECT user_code FROM users3 WHERE user_code LIKE 'IE%'
     ORDER BY user_code DESC LIMIT 1`
  )
  if (rows.length === 0) return 'IE0001'
  const last = parseInt(rows[0].user_code.replace('IE', ''), 10)
  return 'IE' + String(last + 1).padStart(4, '0')
}

// Base SELECT columns shared by list + detail
const BASE_SELECT = `
  u.id,
  u.user_code,
  u.status,
  u.status_toggle,
  u.first_name,
  u.middle_name,
  u.last_name,
  u.suffix,
  u.email,
  u.date_of_birth,
  u.gender,
  u.is_remote_working,
  u.is_manager,
  u.office_location,
  u.department,
  u.address_line1,
  u.address_line2,
  u.country_code,
  u.state_code,
  u.city,
  u.county,
  u.zip_code,
  u.latitude,
  u.longitude,
  u.telephone_number,
  u.telephone_number_cc,
  u.alt_telephone_number,
  u.alt_telephone_number_cc,
  u.extension,
  u.bio,
  u.created_on,
  u.updated_on,
  u.reports_to,
  mgr.first_name || ' ' || mgr.last_name AS manager_name,
  c.name        AS country_name,
  st.name       AS state_name
`

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/users  — paginated list with search + status filter
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  const {
    search   = '',
    status   = '',
    page     = '1',
    pageSize = '20',
    sortBy   = 'created_on',
    sortDir  = 'desc',
  } = req.query

  const offset = (parseInt(page) - 1) * parseInt(pageSize)
  const params = []
  const conditions = []

  if (search) {
    params.push(`%${search}%`)
    conditions.push(`(
      u.first_name  ILIKE $${params.length} OR
      u.last_name   ILIKE $${params.length} OR
      u.email       ILIKE $${params.length} OR
      u.user_code   ILIKE $${params.length} OR
      u.department  ILIKE $${params.length}
    )`)
  }
  if (status) {
    params.push(status)
    conditions.push(`u.status = $${params.length}`)
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''
  const allowedSort = ['created_on', 'first_name', 'last_name', 'email', 'status', 'user_code']
  const orderCol = allowedSort.includes(sortBy) ? `u.${sortBy}` : 'u.created_on'
  const orderDir = sortDir === 'asc' ? 'ASC' : 'DESC'

  try {
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM users3 u ${where}`, params
    )
    const total = parseInt(countResult.rows[0].count)

    params.push(parseInt(pageSize), offset)
    const { rows } = await pool.query(
      `SELECT ${BASE_SELECT}
       FROM users3 u
       LEFT JOIN users3 mgr ON u.reports_to = mgr.id
       LEFT JOIN country   c  ON u.country_code = c.code
       LEFT JOIN state     st ON u.state_code = st.code AND u.country_code = st.country_code
       ${where}
       ORDER BY ${orderCol} ${orderDir}
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    )

    // Attach groups per user
    const userIds = rows.map(r => r.id)
    let groupMap = {}
    if (userIds.length) {
      const gRows = await pool.query(
        `SELECT gu.user_id, gu.group_id AS id, g.group_name
         FROM group_user gu
         JOIN "group" g ON gu.group_id = g.id
         WHERE gu.user_id = ANY($1)`,
        [userIds]
      )
      gRows.rows.forEach(r => {
        if (!groupMap[r.user_id]) groupMap[r.user_id] = []
        groupMap[r.user_id].push({ id: r.id, group_name: r.group_name })
      })
    }
    const items = rows.map(r => ({ ...r, groups: groupMap[r.id] || [] }))

    // KPI counts
    const kpi = await pool.query(
      `SELECT
         COUNT(*)                               AS total,
         COUNT(*) FILTER (WHERE status='Active')   AS active,
         COUNT(*) FILTER (WHERE status='Inactive') AS inactive
       FROM users3`
    )

    res.json({ items, total, page: parseInt(page), pageSize: parseInt(pageSize), ...kpi.rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/users/:id
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT ${BASE_SELECT}
       FROM users3 u
       LEFT JOIN users3 mgr ON u.reports_to = mgr.id
       LEFT JOIN country   c  ON u.country_code = c.code
       LEFT JOIN state     st ON u.state_code = st.code AND u.country_code = st.country_code
       WHERE u.id = $1`,
      [req.params.id]
    )
    if (!rows.length) return res.status(404).json({ error: 'User not found' })

    const user = rows[0]

    // Groups
    const gRows = await pool.query(
      `SELECT g.id, g.group_name FROM group_user gu
       JOIN "group" g ON gu.group_id = g.id
       WHERE gu.user_id = $1`,
      [user.id]
    )
    user.groups = gRows.rows

    // Permissions
    const pRows = await pool.query(
      `SELECT us.screen_id, s.screen_code, s.screen_name, m.module_name,
              us.is_view_permission, us.is_create_permission, us.is_edit_permission,
              us.is_duplicate_permission, us.is_upload_permission, us.is_download_permission,
              us.is_view_sensitive_info, us.is_access_sensitive_doc, us.is_approve_reject,
              us.all_access
       FROM user_screen us
       JOIN app_screen s ON us.screen_id = s.id
       JOIN module m ON s.module_id = m.id
       WHERE us.user_id = $1`,
      [user.id]
    )
    user.permissions = pRows.rows

    res.json(user)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/users  — create user
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const user_code = await generateUserCode()
    const {
      first_name, middle_name, last_name, suffix,
      date_of_birth, gender, is_remote_working = false,
      office_location, department, is_manager = false, reports_to,
      address_line1, address_line2, country_code, state_code,
      city, county, zip_code, latitude, longitude,
      telephone_number, telephone_number_cc,
      alt_telephone_number, alt_telephone_number_cc,
      email, extension, bio,
      group_ids = [],
      permissions = [],
    } = req.body

    // Validate required fields
    if (!first_name || !last_name || !email) {
      return res.status(400).json({ error: 'first_name, last_name and email are required' })
    }

    // Insert user
    const { rows } = await client.query(
      `INSERT INTO users3 (
        user_code, client_id, status, status_toggle,
        first_name, middle_name, last_name, suffix,
        date_of_birth, gender, is_remote_working,
        office_location, department, is_manager, reports_to,
        address_line1, address_line2, country_code, state_code,
        city, county, zip_code, latitude, longitude,
        telephone_number, telephone_number_cc,
        alt_telephone_number, alt_telephone_number_cc,
        email, extension, bio,
        created_on
      ) VALUES (
        $1,1,'Active',true,
        $2,$3,$4,$5,
        $6,$7,$8,
        $9,$10,$11,$12,
        $13,$14,$15,$16,
        $17,$18,$19,$20,$21,
        $22,$23,$24,$25,
        $26,$27,$28,
        now()
      ) RETURNING id, user_code`,
      [
        user_code,
        first_name, middle_name || null, last_name, suffix || null,
        date_of_birth || null, gender || null, is_remote_working,
        office_location || null, department || null, is_manager, (reports_to && !isNaN(Number(reports_to))) ? Number(reports_to) : null,
        address_line1 || null, address_line2 || null, country_code || null, state_code || null,
        city || null, county || null, zip_code || null,
        latitude || null, longitude || null,
        telephone_number || null, telephone_number_cc || null,
        alt_telephone_number || null, alt_telephone_number_cc || null,
        email, extension || null, bio || null,
      ]
    )

    const userId = rows[0].id

    // Insert group memberships
    for (const gid of group_ids) {
      await client.query(
        'INSERT INTO group_user (user_id, group_id, client_id) VALUES ($1, $2, 1) ON CONFLICT DO NOTHING',
        [userId, gid]
      )
    }

    // Insert permissions (full replace)
    for (const p of permissions) {
      await client.query(
        `INSERT INTO user_screen (
          user_id, screen_id,
          is_view_permission, is_create_permission, is_edit_permission,
          is_duplicate_permission, is_upload_permission, is_download_permission,
          is_view_sensitive_info, is_access_sensitive_doc, is_approve_reject, all_access
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
        ON CONFLICT (user_id, screen_id) DO UPDATE SET
          is_view_permission      = EXCLUDED.is_view_permission,
          is_create_permission    = EXCLUDED.is_create_permission,
          is_edit_permission      = EXCLUDED.is_edit_permission,
          is_duplicate_permission = EXCLUDED.is_duplicate_permission,
          is_upload_permission    = EXCLUDED.is_upload_permission,
          is_download_permission  = EXCLUDED.is_download_permission,
          is_view_sensitive_info  = EXCLUDED.is_view_sensitive_info,
          is_access_sensitive_doc = EXCLUDED.is_access_sensitive_doc,
          is_approve_reject       = EXCLUDED.is_approve_reject,
          all_access              = EXCLUDED.all_access`,
        [
          userId, p.screen_id,
          p.is_view_permission      || false,
          p.is_create_permission    || false,
          p.is_edit_permission      || false,
          p.is_duplicate_permission || false,
          p.is_upload_permission    || false,
          p.is_download_permission  || false,
          p.is_view_sensitive_info  || false,
          p.is_access_sensitive_doc || false,
          p.is_approve_reject       || false,
          p.all_access              || false,
        ]
      )
    }

    await client.query('COMMIT')
    res.status(201).json({ id: userId, user_code: rows[0].user_code })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('POST /api/users error:', err.message, err.detail || '')
    if (err.code === '23505') return res.status(409).json({ error: 'Email already exists' })
    res.status(500).json({ error: err.message, detail: err.detail || undefined })
  } finally {
    client.release()
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/users/:id  — update user
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const {
      first_name, middle_name, last_name, suffix,
      date_of_birth, gender, is_remote_working,
      office_location, department, is_manager, reports_to,
      address_line1, address_line2, country_code, state_code,
      city, county, zip_code, latitude, longitude,
      telephone_number, telephone_number_cc,
      alt_telephone_number, alt_telephone_number_cc,
      email, extension, bio,
      group_ids = [],
      permissions = [],
    } = req.body

    await client.query(
      `UPDATE users3 SET
        first_name = $1, middle_name = $2, last_name = $3, suffix = $4,
        date_of_birth = $5, gender = $6, is_remote_working = $7,
        office_location = $8, department = $9, is_manager = $10, reports_to = $11,
        address_line1 = $12, address_line2 = $13, country_code = $14, state_code = $15,
        city = $16, county = $17, zip_code = $18, latitude = $19, longitude = $20,
        telephone_number = $21, telephone_number_cc = $22,
        alt_telephone_number = $23, alt_telephone_number_cc = $24,
        email = $25, extension = $26, bio = $27,
        updated_on = now()
       WHERE id = $28`,
      [
        first_name, middle_name || null, last_name, suffix || null,
        date_of_birth || null, gender || null, is_remote_working ?? false,
        office_location || null, department || null, is_manager ?? false, (reports_to && !isNaN(Number(reports_to))) ? Number(reports_to) : null,
        address_line1 || null, address_line2 || null, country_code || null, state_code || null,
        city || null, county || null, zip_code || null,
        latitude || null, longitude || null,
        telephone_number || null, telephone_number_cc || null,
        alt_telephone_number || null, alt_telephone_number_cc || null,
        email, extension || null, bio || null,
        req.params.id,
      ]
    )

    // Full-replace groups
    await client.query('DELETE FROM group_user WHERE user_id = $1', [req.params.id])
    for (const gid of group_ids) {
      await client.query(
        'INSERT INTO group_user (user_id, group_id, client_id) VALUES ($1, $2, 1) ON CONFLICT DO NOTHING',
        [req.params.id, gid]
      )
    }

    // Full-replace permissions
    await client.query('DELETE FROM user_screen WHERE user_id = $1', [req.params.id])
    for (const p of permissions) {
      await client.query(
        `INSERT INTO user_screen (
          user_id, screen_id,
          is_view_permission, is_create_permission, is_edit_permission,
          is_duplicate_permission, is_upload_permission, is_download_permission,
          is_view_sensitive_info, is_access_sensitive_doc, is_approve_reject, all_access
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [
          req.params.id, p.screen_id,
          p.is_view_permission      || false,
          p.is_create_permission    || false,
          p.is_edit_permission      || false,
          p.is_duplicate_permission || false,
          p.is_upload_permission    || false,
          p.is_download_permission  || false,
          p.is_view_sensitive_info  || false,
          p.is_access_sensitive_doc || false,
          p.is_approve_reject       || false,
          p.all_access              || false,
        ]
      )
    }

    await client.query('COMMIT')
    res.json({ success: true })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(err)
    if (err.code === '23505') return res.status(409).json({ error: 'Email already exists' })
    res.status(500).json({ error: err.message })
  } finally {
    client.release()
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/users/:id/status  — toggle Active / Inactive
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body
    if (!['Active', 'Inactive'].includes(status)) {
      return res.status(400).json({ error: 'status must be Active or Inactive' })
    }
    await pool.query(
      `UPDATE users3 SET status = $1, status_toggle = $2, updated_on = now() WHERE id = $3`,
      [status, status === 'Active', req.params.id]
    )
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/users/:id  — soft delete (set Inactive)
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    await pool.query(
      `UPDATE users3 SET status = 'Inactive', status_toggle = false, updated_on = now() WHERE id = $1`,
      [req.params.id]
    )
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
