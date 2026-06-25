// Run: node db/migrate.js
require('dotenv').config()
const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

const SQL_FILES = [
  '001_users_schema.sql',
  '002_country_state_seed.sql',
  '003_dev_seed.sql',
]

async function migrate() {
  const client = new Client({
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME     || 'insuredge',
    user:     process.env.DB_USER     || 'postgres',
    password: process.env.DB_PASSWORD || 'userpass',
  })

  await client.connect()
  console.log('Connected to:', process.env.DB_NAME || 'insuredge')

  for (const file of SQL_FILES) {
    const filePath = path.join(__dirname, file)
    const sql = fs.readFileSync(filePath, 'utf8')
    console.log(`Running ${file}...`)
    try {
      await client.query(sql)
      console.log(`  ✓ ${file}`)
    } catch (err) {
      console.error(`  ✗ ${file}:`, err.message)
      await client.end()
      process.exit(1)
    }
  }

  await client.end()
  console.log('\nAll migrations complete.')
}

migrate().catch(err => { console.error(err); process.exit(1) })
