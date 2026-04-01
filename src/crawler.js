import fs from 'fs'
import path from 'path'

// These are the only folders and file types we care about
const ALLOWED_EXTENSIONS = ['.liquid', '.json', '.css', '.js']
const ALLOWED_FOLDERS = ['sections', 'snippets', 'assets', 'layout', 'templates', 'config']

// Break text into chunks of ~500 characters so embeddings are focused
function chunkText(text, filePath, chunkSize = 500) {
  const chunks = []
  let start = 0

  while (start < text.length) {
    const chunk = text.slice(start, start + chunkSize)
    if (chunk.trim().length > 0) {
      chunks.push({
        filePath,
        chunkText: chunk.trim()
      })
    }
    start += chunkSize
  }

  return chunks
}

// Walk through the dawn-theme folder and collect all relevant files
export function crawlTheme(themeDir) {
  const allChunks = []

  for (const folder of ALLOWED_FOLDERS) {
    const folderPath = path.join(themeDir, folder)

    // Skip if folder doesn't exist
    if (!fs.existsSync(folderPath)) continue

    const files = fs.readdirSync(folderPath)

    for (const file of files) {
      const ext = path.extname(file)

      // Skip files we don't care about
      if (!ALLOWED_EXTENSIONS.includes(ext)) continue

      const filePath = path.join(folderPath, file)
      const content = fs.readFileSync(filePath, 'utf-8')
      const relativePath = `${folder}/${file}`

      console.log(`📄 Crawling: ${relativePath}`)

      const chunks = chunkText(content, relativePath)
      allChunks.push(...chunks)
    }
  }

  console.log(`\n✅ Done crawling. Total chunks: ${allChunks.length}`)
  return allChunks
}