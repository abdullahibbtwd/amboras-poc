import express from 'express'
import { askQuestion } from './src/chat.js'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
app.use(express.json())
app.use(express.static('public'))

app.post('/chat', async (req, res) => {
  const { question } = req.body

  if (!question) {
    return res.status(400).json({ error: 'Question is required' })
  }

  try {
    const answer = await askQuestion(question)
    res.json({ answer })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong' })
  }
})

app.listen(3000, () => {
  console.log('🚀 Server running at http://localhost:3000')
})