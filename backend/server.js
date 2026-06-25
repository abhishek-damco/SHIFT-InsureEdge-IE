require('dotenv').config()
const express = require('express')
const cors    = require('cors')

const usersRouter     = require('./src/routes/users')
const referenceRouter = require('./src/routes/reference')

const app  = express()
const PORT = process.env.PORT || 4000

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'user-management-api' }))

// Routes
app.use('/api/users',     usersRouter)
app.use('/api/reference', referenceRouter)

// 404 fallback
app.use((req, res) => res.status(404).json({ error: `Route ${req.method} ${req.path} not found` }))

// Error handler
app.use((err, req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`User Management API running on http://localhost:${PORT}`)
  console.log(`DB: ${process.env.DB_NAME}@${process.env.DB_HOST}:${process.env.DB_PORT}`)
})
