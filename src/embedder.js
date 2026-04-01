import { GoogleGenerativeAI } from '@google/generative-ai'
import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { Pool } from '@neondatabase/serverless'
import { crawlTheme } from './crawler.js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config()

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaNeon(pool)
const prisma = new PrismaClient({ adapter })

// Get embedding vector from Gemini for a piece of text
async function getEmbedding(text) {
  const model = genAI.getGenerativeModel({ model: 'textembedding-gecko' })
  const result = await model.embedContent(text)
  return result.embedding.values
}

// Save a single chunk + its vector to Neon
async function saveChunk(filePath, chunkText, embedding) {
  const vector = `[${embedding.join(',')}]`

  await prisma.$executeRaw`
    INSERT INTO "ThemeEmbedding" ("filePath", "chunkText", "embedding")
    VALUES (${filePath}, ${chunkText}, ${vector}::vector)
  `
}

// Main function — crawl, embed, save
async function embedTheme() {
  const themeDir = path.join(process.cwd(), 'dawn-theme')

  console.log('🚀 Starting theme crawl...\n')
  const chunks = crawlTheme(themeDir)

  console.log('\n🧠 Starting embedding...\n')

  for (let i = 0; i < chunks.length; i++) {
    const { filePath, chunkText } = chunks[i]

    try {
      const embedding = await getEmbedding(chunkText)
      await saveChunk(filePath, chunkText, embedding)
      console.log(`✅ Saved chunk ${i + 1}/${chunks.length} — ${filePath}`)
    } catch (err) {
      console.log(`❌ Failed chunk ${i + 1} — ${filePath}: ${err.message}`)
    }

    // Small delay to avoid hitting Gemini rate limits
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  console.log('\n🎉 All chunks embedded and saved to Neon!')
  await prisma.$disconnect()
}

embedTheme()