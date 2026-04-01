import fs from 'fs'
import path from 'path'

const THEME_DIR = path.join(process.cwd(), 'dawn-theme')

// Extract CSS variables and color values
function extractColors(css) {
  const colors = new Set()

  // Match hex colors
  const hexMatches = css.match(/#([0-9a-fA-F]{3,6})\b/g) || []
  hexMatches.forEach(c => colors.add(c))

  // Match CSS variables that contain color
  const varMatches = css.match(/--color[^:]+:\s*([^;]+)/g) || []
  varMatches.forEach(v => colors.add(v.trim()))

  return [...colors].slice(0, 30)
}

// Extract font families
function extractFonts(css) {
  const fonts = new Set()
  const matches = css.match(/font-family:\s*([^;]+)/g) || []
  matches.forEach(f => {
    const clean = f.replace('font-family:', '').trim()
    fonts.add(clean)
  })
  return [...fonts].slice(0, 10)
}

// Extract spacing values
function extractSpacing(css) {
  const spacing = new Set()
  const matches = css.match(/--spacing[^:]+:\s*([^;]+)/g) || []
  matches.forEach(s => spacing.add(s.trim()))
  return [...spacing].slice(0, 10)
}

// Read actual color values from settings_data.json
function extractActualColors() {
  const settingsPath = path.join(THEME_DIR, 'config', 'settings_data.json')
  if (!fs.existsSync(settingsPath)) return 'No settings_data.json found'

  try {
    const raw = fs.readFileSync(settingsPath, 'utf-8')
    const json = JSON.parse(raw)

    const current = json.current || {}
    const colors = []

    // Walk through all settings and find color values
    for (const [key, value] of Object.entries(current)) {
      if (
        typeof value === 'string' &&
        (value.startsWith('#') || value.startsWith('rgb'))
      ) {
        colors.push(`${key}: ${value}`)
      }
    }

    return colors.length > 0
      ? colors.join('\n')
      : 'No explicit colors set — theme uses defaults'
  } catch {
    return 'Could not parse settings_data.json'
  }
}

// Read settings_schema.json for store config
function extractConfig() {
  const configPath = path.join(THEME_DIR, 'config', 'settings_schema.json')
  if (!fs.existsSync(configPath)) return 'No config found'

  try {
    const raw = fs.readFileSync(configPath, 'utf-8')
    const json = JSON.parse(raw)
    const summary = json.map(section => {
      return `SECTION: ${section.name || 'unnamed'}`
    }).join('\n')
    return summary
  } catch {
    return 'Could not parse config'
  }
}

// Read all CSS files from assets folder
function readCSS() {
  const assetsDir = path.join(THEME_DIR, 'assets')
  if (!fs.existsSync(assetsDir)) return ''

  const cssFiles = fs.readdirSync(assetsDir).filter(f => f.endsWith('.css'))
  let allCSS = ''

  for (const file of cssFiles) {
    const content = fs.readFileSync(path.join(assetsDir, file), 'utf-8')
    allCSS += content + '\n'
  }

  return allCSS
}

// Read key liquid files
function readLiquidSummary() {
  const sections = []
  const sectionsDir = path.join(THEME_DIR, 'sections')

  if (!fs.existsSync(sectionsDir)) return 'No sections found'

  const files = fs.readdirSync(sectionsDir).filter(f => f.endsWith('.liquid'))
  files.forEach(f => sections.push(f.replace('.liquid', '')))

  return `AVAILABLE SECTIONS:\n${sections.join(', ')}`
}

// Main export — builds the full context string
export function extractThemeContext() {
  console.log('🔍 Extracting theme context...')

  const css = readCSS()
  const colors = extractColors(css)
  const fonts = extractFonts(css)
  const spacing = extractSpacing(css)
  const config = extractConfig()
  const liquidSummary = readLiquidSummary()
  const actualColors = extractActualColors()

  const context = `
=== SHOPIFY THEME ANALYSIS ===

ACTUAL THEME COLORS (from settings_data.json):
${actualColors}

CSS COLOR VARIABLES DEFINED:
${colors.length > 0 ? colors.join('\n') : 'No colors found'}

FONTS FOUND:
${fonts.length > 0 ? fonts.join('\n') : 'No fonts found'}

SPACING VARIABLES:
${spacing.length > 0 ? spacing.join('\n') : 'No spacing variables found'}

THEME CONFIG SECTIONS:
${config}

${liquidSummary}
`.trim()

  console.log('✅ Theme context extracted successfully')
  return context
}