# Theme Intelligence

A lightweight AI-powered assistant for Shopify theme research.

It turns a local Shopify theme codebase (`dawn-theme`) into a **queryable design system**, allowing you to ask natural language questions about colors, typography, buttons, and sections — and get structured answers powered by LLMs.

---

## Why this exists

Shopify themes are powerful but hard to reason about as a system.
Design decisions are scattered across JSON configs, CSS, and Liquid files.

This tool bridges that gap by converting raw theme internals into **structured, searchable design intelligence**.

---

## What it does

* Chat-based UI for asking theme questions
* `/chat` API for processing requests
* Extracts structured knowledge from Shopify theme files
* Builds intent-aware context (colors, typography, buttons, sections)
* Uses Gemini to generate concise, structured responses
* Handles API failures gracefully (rate limits, errors, etc.)
* Caches extracted theme knowledge for performance

---

## Example questions

* What defines the button style in this theme?
* What color system is used?
* What typography scale is configured?
* Which sections exist on the homepage?
* How are forms styled?

---

## Architecture

### Frontend

* `public/index.html`

  * Lightweight dark chat interface
  * Sends messages to `/chat`
  * Renders AI responses in real time

---

### Backend

* `server.js`

  * Express server
  * Serves frontend assets
  * Exposes `POST /chat`

* `src/chat.js`

  * Integrates with Gemini (`gemini-flash-latest`)
  * Builds structured prompts with extracted theme context
  * Normalizes API errors into readable responses

* `src/extractor.js`

  * Parses Shopify theme files:

    * `settings_data.json`
    * `settings_schema.json`
    * CSS assets
    * Liquid sections & snippets
  * Builds a cached design-system representation
  * Performs intent detection to return only relevant context

---

## Data sources

The assistant analyzes a local Shopify theme:

```
dawn-theme/
  config/
    settings_data.json
    settings_schema.json
  assets/
    *.css
  sections/
  snippets/
```

---

## Project structure

```
amboras-poc/
  public/
    index.html

  src/
    chat.js
    extractor.js
    crawler.js
    embedder.js

  dawn-theme/
    config/
    assets/
    sections/
    snippets/

  server.js
  package.json
  .env
```

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create a `.env` file:

```env
GEMINI_API_KEY=your_key_here
```

### 3. Add theme files

Ensure your Shopify theme exists at:

```
dawn-theme/
```

---

## Run the project

```bash
npm start
```

Open:

```
http://localhost:3000
```

---

## API

### POST `/chat`

#### Request

```json
{
  "question": "What is the button style?"
}
```

#### Response

```json
{
  "answer": "- border thickness: 1px\n- opacity: 100%\n- ..."
}
```

---

## Notes

* Theme context is cached and refreshed automatically when theme files change
* Gemini quota errors are converted into user-friendly messages
* `crawler.js` and `embedder.js` are reserved for future vector / embedding upgrades

---

## Vision

This project explores how LLMs can transform raw frontend codebases into **intelligent design systems** — making theme understanding faster, structured, and accessible through natural language.
