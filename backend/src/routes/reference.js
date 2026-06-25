const { Router } = require('express')
const pool = require('../db/pool')

const router = Router()

// GET /api/reference/countries
router.get('/countries', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT code, name, country_dial_code FROM country ORDER BY name'
    )
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/reference/states?country_code=US
router.get('/states', async (req, res) => {
  const { country_code } = req.query
  if (!country_code) return res.status(400).json({ error: 'country_code is required' })
  try {
    const { rows } = await pool.query(
      'SELECT code, name, abbreviation FROM state WHERE country_code = $1 ORDER BY name',
      [country_code]
    )
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/reference/groups  — for group picker in Add User
router.get('/groups', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, group_code, group_name FROM "group"
       WHERE LOWER(status) = 'active' ORDER BY group_name`
    )
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/reference/modules — modules + screens for permission grid
router.get('/modules', async (req, res) => {
  try {
    const modules = await pool.query(
      'SELECT id, module_name FROM module ORDER BY sort_order'
    )
    const screens = await pool.query(
      'SELECT id, screen_code, screen_name, module_id FROM app_screen ORDER BY id'
    )

    const result = modules.rows.map(m => ({
      id: m.id,
      module_name: m.module_name,
      screens: screens.rows.filter(s => s.module_id === m.id),
    }))
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/reference/managers — active users for "Reports To" dropdown
router.get('/managers', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, user_code, first_name, last_name, email
       FROM users3 WHERE status = 'Active' ORDER BY first_name, last_name`
    )
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
