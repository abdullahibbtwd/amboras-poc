import fs from 'fs'
import path from 'path'

const THEME_DIR = path.join(process.cwd(), 'dawn-theme')
const ASSETS_DIR = path.join(THEME_DIR, 'assets')
const CONFIG_DIR = path.join(THEME_DIR, 'config')
const SECTIONS_DIR = path.join(THEME_DIR, 'sections')
const SNIPPETS_DIR = path.join(THEME_DIR, 'snippets')

let cachedFingerprint = null
let cachedKnowledge = null

function safeReadFile(filePath) {
  if (!fs.existsSync(filePath)) return ''
  return fs.readFileSync(filePath, 'utf-8')
}

function safeListFiles(dirPath, extension) {
  if (!fs.existsSync(dirPath)) return []
  return fs.readdirSync(dirPath).filter(file => file.endsWith(extension))
}

function getFingerprint() {
  const importantFiles = [
    path.join(CONFIG_DIR, 'settings_data.json'),
    path.join(CONFIG_DIR, 'settings_schema.json'),
  ]

  const cssFiles = safeListFiles(ASSETS_DIR, '.css').map(file =>
    path.join(ASSETS_DIR, file)
  )

  const files = [...importantFiles, ...cssFiles]
  const stats = files
    .filter(file => fs.existsSync(file))
    .map(file => {
      const stat = fs.statSync(file)
      return `${file}:${stat.size}:${stat.mtimeMs}`
    })

  return stats.join('|')
}

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

function parseSettingsData() {
  const settingsPath = path.join(CONFIG_DIR, 'settings_data.json')
  try {
    const raw = safeReadFile(settingsPath)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function parseSettingsSchema() {
  const configPath = path.join(CONFIG_DIR, 'settings_schema.json')
  try {
    const raw = safeReadFile(configPath)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

// Read all CSS files from assets folder
function readCSS() {
  const cssFiles = safeListFiles(ASSETS_DIR, '.css')
  let allCSS = ''

  for (const file of cssFiles) {
    const content = safeReadFile(path.join(ASSETS_DIR, file))
    allCSS += content + '\n'
  }

  return allCSS
}

function extractPresetColors(settingsData) {
  const activePresetName = settingsData?.current
  const activePreset = settingsData?.presets?.[activePresetName]
  const schemes = activePreset?.color_schemes || {}
  const rows = []

  for (const [schemeName, schemeData] of Object.entries(schemes)) {
    const settings = schemeData?.settings || {}
    for (const [key, value] of Object.entries(settings)) {
      if (typeof value === 'string' && (value.startsWith('#') || value.startsWith('rgb'))) {
        rows.push(`${schemeName}.${key}: ${value}`)
      }
    }
  }

  return rows
}

function extractButtonColorRows(presetColorRows) {
  return (presetColorRows || []).filter(row =>
    /\.button\b|\.button_label\b|\.secondary_button_label\b/.test(row)
  )
}

function extractButtonAndTypographySettings(settingsData) {
  const activePresetName = settingsData?.current
  const activePreset = settingsData?.presets?.[activePresetName]
  const rows = []
  if (!activePreset) return rows

  const wantedPatterns = [
    /^buttons_/,
    /^inputs_/,
    /^variant_pills_/,
    /^type_/,
    /font/i,
    /heading_scale/,
    /body_scale/,
  ]

  for (const [key, value] of Object.entries(activePreset)) {
    if (key === 'color_schemes' || key === 'sections') continue
    if (wantedPatterns.some(pattern => pattern.test(key))) {
      rows.push(`${key}: ${value}`)
    }
  }

  return rows
}

function extractSchemaInsights(schema) {
  if (!Array.isArray(schema)) {
    return {
      sectionNames: [],
      buttonControls: [],
      fontControls: [],
      colorControls: [],
    }
  }

  const sectionNames = []
  const buttonControls = []
  const fontControls = []
  const colorControls = []

  for (const section of schema) {
    sectionNames.push(section?.name || 'unnamed')

    const settings = section?.settings || []
    for (const setting of settings) {
      const id = setting?.id || ''
      if (!id) continue

      if (/button|input|pill/i.test(id)) buttonControls.push(id)
      if (/font|type|heading|body/i.test(id)) fontControls.push(id)
      if (/color|background|text|shadow/i.test(id)) colorControls.push(id)
    }
  }

  return {
    sectionNames,
    buttonControls: [...new Set(buttonControls)].slice(0, 30),
    fontControls: [...new Set(fontControls)].slice(0, 30),
    colorControls: [...new Set(colorControls)].slice(0, 30),
  }
}

function extractThemeStructure() {
  const sections = safeListFiles(SECTIONS_DIR, '.liquid').map(file =>
    file.replace('.liquid', '')
  )
  const snippets = safeListFiles(SNIPPETS_DIR, '.liquid').map(file =>
    file.replace('.liquid', '')
  )

  return {
    sections,
    snippets,
  }
}

function toBlock(title, rows, max = 60) {
  if (!rows || rows.length === 0) return `${title}:\nNone`
  return `${title}:\n${rows.slice(0, max).join('\n')}`
}

function buildThemeKnowledge() {
  const css = readCSS()
  const settingsData = parseSettingsData()
  const settingsSchema = parseSettingsSchema()
  const schemaInsights = extractSchemaInsights(settingsSchema)
  const structure = extractThemeStructure()
  const presetColors = extractPresetColors(settingsData)

  return {
    activePreset: settingsData?.current || 'unknown',
    presetColors,
    buttonColors: extractButtonColorRows(presetColors),
    buttonAndTypography: extractButtonAndTypographySettings(settingsData),
    cssColors: extractColors(css),
    cssFonts: extractFonts(css),
    cssSpacing: extractSpacing(css),
    schemaSectionNames: schemaInsights.sectionNames,
    schemaButtonControls: schemaInsights.buttonControls,
    schemaFontControls: schemaInsights.fontControls,
    schemaColorControls: schemaInsights.colorControls,
    sections: structure.sections,
    snippets: structure.snippets,
  }
}

function getKnowledge() {
  const currentFingerprint = getFingerprint()
  if (!cachedKnowledge || cachedFingerprint !== currentFingerprint) {
    cachedKnowledge = buildThemeKnowledge()
    cachedFingerprint = currentFingerprint
    console.log('✅ Theme context cache rebuilt')
  }

  return cachedKnowledge
}

function detectIntent(question) {
  const q = (question || '').toLowerCase()
  return {
    colors: /color|colour|palette|background|foreground|text color|hex|rgba|button color/.test(q),
    buttons: /button|cta|pill|input|border|radius|shadow/.test(q),
    fonts: /font|typography|heading|body text|typeface|text style/.test(q),
    sections: /section|block|template|component|snippet|module|layout/.test(q),
  }
}

export function getThemeContextForQuestion(question) {
  const knowledge = getKnowledge()
  const intent = detectIntent(question)

  const blocks = [
    `ACTIVE PRESET:\n${knowledge.activePreset}`,
  ]

  if (intent.colors) {
    blocks.push(toBlock('EXPLICIT PRESET COLORS', knowledge.presetColors))
    blocks.push(toBlock('CSS COLOR TOKENS', knowledge.cssColors))
    blocks.push(toBlock('SCHEMA COLOR CONTROLS', knowledge.schemaColorControls))
  }

  if (intent.buttons) {
    blocks.push(toBlock('BUTTON + INPUT STYLE SETTINGS', knowledge.buttonAndTypography))
    blocks.push(toBlock('BUTTON COLORS BY SCHEME', knowledge.buttonColors))
    blocks.push(toBlock('SCHEMA BUTTON CONTROLS', knowledge.schemaButtonControls))
  }

  if (intent.fonts) {
    blocks.push(toBlock('TYPOGRAPHY SETTINGS', knowledge.buttonAndTypography.filter(row => /type_|font|heading_scale|body_scale/.test(row))))
    blocks.push(toBlock('CSS FONTS', knowledge.cssFonts))
    blocks.push(toBlock('SCHEMA FONT CONTROLS', knowledge.schemaFontControls))
  }

  if (intent.sections) {
    blocks.push(toBlock('AVAILABLE SECTIONS', knowledge.sections))
    blocks.push(toBlock('AVAILABLE SNIPPETS', knowledge.snippets))
    blocks.push(toBlock('SCHEMA SECTIONS', knowledge.schemaSectionNames))
  }

  if (!intent.colors && !intent.buttons && !intent.fonts && !intent.sections) {
    blocks.push(toBlock('EXPLICIT PRESET COLORS', knowledge.presetColors, 30))
    blocks.push(toBlock('BUTTON + INPUT STYLE SETTINGS', knowledge.buttonAndTypography, 30))
    blocks.push(toBlock('TYPOGRAPHY (CSS)', knowledge.cssFonts, 15))
    blocks.push(toBlock('AVAILABLE SECTIONS', knowledge.sections, 40))
  }

  return `
=== SHOPIFY THEME KNOWLEDGE ===
${blocks.join('\n\n')}
`.trim()
}

// Main export — builds the full context string
export function extractThemeContext() {
  return getThemeContextForQuestion('overview')
}