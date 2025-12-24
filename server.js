import express from 'express'
import cors from 'cors'
import Database from 'better-sqlite3'
import pg from 'pg'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()

// Database configuration from environment variable
const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is required')
  console.error('Examples:')
  console.error('  SQLite:     DATABASE_URL=sqlite:///app/data/webui.db')
  console.error('  PostgreSQL: DATABASE_URL=postgresql://user:pass@host:5432/dbname')
  process.exit(1)
}

let db
let isPostgreSQL = false

if (DATABASE_URL.startsWith('postgresql://') || DATABASE_URL.startsWith('postgres://')) {
  isPostgreSQL = true
  const { Pool } = pg
  db = new Pool({
    connectionString: DATABASE_URL,
  })
  console.log('Connected to PostgreSQL database')
} else if (DATABASE_URL.startsWith('sqlite://')) {
  // Handle both sqlite:///path and sqlite:////path (absolute)
  let dbPath = DATABASE_URL.replace('sqlite://', '')
  // Remove leading slashes and determine if absolute
  while (dbPath.startsWith('/')) {
    dbPath = dbPath.substring(1)
  }
  // Always treat as absolute path in container
  dbPath = '/' + dbPath
  
  if (!fs.existsSync(dbPath)) {
    console.error(`ERROR: SQLite database file not found at: ${dbPath}`)
    console.error('Make sure to mount the database file into the container')
    process.exit(1)
  }
  db = new Database(dbPath, { readonly: true })
  console.log(`Connected to SQLite database: ${dbPath}`)
} else {
  console.error('ERROR: Unsupported database URL. Only SQLite and PostgreSQL are supported.')
  process.exit(1)
}

app.use(cors())
app.use(express.json())

// Serve static files from dist folder in production
const distPath = join(__dirname, 'dist')
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath))
}

// Database query helpers
async function executeQuery(query, params = []) {
  if (isPostgreSQL) {
    const result = await db.query(query, params)
    return result.rows
  } else {
    const stmt = db.prepare(query)
    if (params.length > 0) {
      return stmt.all(...params)
    } else {
      return stmt.all()
    }
  }
}

async function executeQuerySingle(query, params = []) {
  if (isPostgreSQL) {
    const result = await db.query(query, params)
    return result.rows[0] || {}
  } else {
    const stmt = db.prepare(query)
    if (params.length > 0) {
      return stmt.get(...params) || {}
    } else {
      return stmt.get() || {}
    }
  }
}

app.get('/api/stats/overview', async (req, res) => {
  try {
    // Calculate total tokens from all chat messages
    let tokenQuery = `
      SELECT 
        SUM(LENGTH(json_extract(msg.value, '$.content'))) as total_chars
      FROM chat c,
           json_each(json_extract(c.chat, '$.history.messages')) as msg
      WHERE json_extract(msg.value, '$.content') IS NOT NULL
        AND json_extract(msg.value, '$.content') != ''
    `
    
    if (isPostgreSQL) {
      tokenQuery = `
        SELECT 
          SUM(LENGTH(msg->>'content')) as total_chars
        FROM chat c,
             jsonb_array_elements(c.chat->'history'->'messages') as msg
        WHERE msg->>'content' IS NOT NULL
          AND msg->>'content' != ''
      `
    }
    
    const tokenResult = await executeQuerySingle(tokenQuery)
    const estimatedTokens = Math.round((tokenResult.total_chars || 0) / 4)
    
    // Calculate total tool usage
    let toolQuery = `
      SELECT COUNT(*) as count
      FROM chat c,
           json_each(json_extract(c.chat, '$.history.messages')) as msg,
           json_each(json_extract(msg.value, '$.statusHistory')) as status
      WHERE json_extract(status.value, '$.action') IS NOT NULL
        AND json_extract(status.value, '$.done') = 1
    `
    
    if (isPostgreSQL) {
      toolQuery = `
        SELECT COUNT(*) as count
        FROM chat c,
             jsonb_array_elements(c.chat->'history'->'messages') as msg,
             jsonb_array_elements(msg->'statusHistory') as status
        WHERE status->>'action' IS NOT NULL
          AND (status->>'done')::int = 1
      `
    }
    
    const toolResult = await executeQuerySingle(toolQuery)
    
    const totalUsersResult = await executeQuerySingle('SELECT COUNT(*) as count FROM "user"')
    const totalChatsResult = await executeQuerySingle('SELECT COUNT(*) as count FROM chat')
    const activeUsersQuery = isPostgreSQL 
      ? `SELECT COUNT(DISTINCT user_id) as count FROM chat WHERE created_at > $1`
      : `SELECT COUNT(DISTINCT user_id) as count FROM chat WHERE created_at > ?`
    const activeUsersResult = await executeQuerySingle(
      activeUsersQuery,
      [Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60]
    )
    const totalModelsResult = await executeQuerySingle('SELECT COUNT(*) as count FROM model WHERE is_active = true')
    
    const stats = {
      totalUsers: totalUsersResult.count,
      totalChats: totalChatsResult.count,
      activeUsers: activeUsersResult.count,
      totalModels: totalModelsResult.count,
      estimatedTokens: estimatedTokens,
      toolUsage: toolResult.count
    }
    res.json(stats)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.get('/api/stats/models', async (req, res) => {
  try {
    let query = `
      SELECT 
        json_extract(msg.value, '$.model') as model,
        COUNT(*) as usage_count,
        SUM(LENGTH(COALESCE(json_extract(msg.value, '$.content'), ''))) as total_chars
      FROM chat c,
           json_each(json_extract(c.chat, '$.history.messages')) as msg
      WHERE json_extract(msg.value, '$.model') IS NOT NULL
      GROUP BY model
      ORDER BY usage_count DESC
      LIMIT 20
    `
    
    if (isPostgreSQL) {
      query = `
        SELECT 
          msg->>'model' as model,
          COUNT(*) as usage_count,
          SUM(LENGTH(COALESCE(msg->>'content', ''))) as total_chars
        FROM chat c,
             jsonb_array_elements(c.chat->'history'->'messages') as msg
        WHERE msg->>'model' IS NOT NULL
        GROUP BY model
        ORDER BY usage_count DESC
        LIMIT 20
      `
    }
    
    const models = await executeQuery(query)
    const modelsWithTokens = models.map(model => ({
      ...model,
      estimated_tokens: Math.round((model.total_chars || 0) / 4)
    }))
    res.json(modelsWithTokens)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.get('/api/stats/activity', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30
    const startTime = Math.floor(Date.now() / 1000) - (days * 24 * 60 * 60)
    
    const query = isPostgreSQL ? `
      SELECT 
        date(to_timestamp(created_at)) as date,
        COUNT(*) as chat_count,
        COUNT(DISTINCT user_id) as unique_users
      FROM chat
      WHERE created_at > $1
      GROUP BY date
      ORDER BY date DESC
    ` : `
      SELECT 
        date(created_at, 'unixepoch') as date,
        COUNT(*) as chat_count,
        COUNT(DISTINCT user_id) as unique_users
      FROM chat
      WHERE created_at > ?
      GROUP BY date
      ORDER BY date DESC
    `
    
    const activity = await executeQuery(query, [startTime])
    res.json(activity)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.get('/api/stats/users', async (req, res) => {
  try {
    let query = `
      SELECT 
        u.id,
        u.name,
        u.role,
        COUNT(c.id) as chat_count,
        MAX(c.updated_at) as last_activity,
        COALESCE(token_stats.estimated_tokens, 0) as estimated_tokens
      FROM "user" u
      LEFT JOIN chat c ON u.id = c.user_id
      LEFT JOIN (
        SELECT 
          c.user_id,
          SUM(LENGTH(COALESCE(json_extract(msg.value, '$.content'), ''))) / 4 as estimated_tokens
        FROM chat c,
             json_each(json_extract(c.chat, '$.history.messages')) as msg
        WHERE json_extract(msg.value, '$.content') IS NOT NULL
          AND json_extract(msg.value, '$.content') != ''
        GROUP BY c.user_id
      ) as token_stats ON u.id = token_stats.user_id
      GROUP BY u.id, u.name, u.role
      ORDER BY chat_count DESC
      LIMIT 50
    `
    
    if (isPostgreSQL) {
      query = `
        SELECT 
          u.id,
          u.name,
          u.role,
          COUNT(c.id) as chat_count,
          MAX(c.updated_at) as last_activity,
          COALESCE(token_stats.estimated_tokens, 0) as estimated_tokens
        FROM "user" u
        LEFT JOIN chat c ON u.id = c.user_id
        LEFT JOIN (
          SELECT 
            c.user_id,
            SUM(LENGTH(COALESCE(msg->>'content', ''))) / 4 as estimated_tokens
          FROM chat c,
               jsonb_array_elements(c.chat->'history'->'messages') as msg
          WHERE msg->>'content' IS NOT NULL
            AND msg->>'content' != ''
          GROUP BY c.user_id
        ) as token_stats ON u.id = token_stats.user_id
        GROUP BY u.id, u.name, u.role
        ORDER BY chat_count DESC
        LIMIT 50
      `
    }
    
    const users = await executeQuery(query)
    const usersWithTokens = users.map(user => ({
      ...user,
      estimated_tokens: Math.round(user.estimated_tokens || 0)
    }))
    res.json(usersWithTokens)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.get('/api/stats/tools', async (req, res) => {
  try {
    // Get built-in tools from statusHistory
    let builtinQuery = `
      SELECT 
        json_extract(status.value, '$.action') as tool_name,
        COUNT(*) as usage_count,
        COUNT(DISTINCT c.user_id) as unique_users,
        COUNT(DISTINCT c.id) as unique_chats,
        'builtin' as tool_type
      FROM chat c,
           json_each(json_extract(c.chat, '$.history.messages')) as msg,
           json_each(json_extract(msg.value, '$.statusHistory')) as status
      WHERE json_extract(status.value, '$.action') IS NOT NULL
        AND json_extract(status.value, '$.done') = 1
      GROUP BY tool_name
    `
    
    let customQuery = `
      WITH tool_extracts AS (
        SELECT DISTINCT
          c.user_id,
          c.id as chat_id,
          CASE 
            WHEN json_extract(msg.value, '$.content') LIKE '%name="tool_get_events_post"%' THEN 'google_calendar'
            WHEN json_extract(msg.value, '$.content') LIKE '%name="tool_list_calendars_post"%' THEN 'google_calendar' 
            WHEN json_extract(msg.value, '$.content') LIKE '%name="tool_create_event_post"%' THEN 'google_calendar'
            WHEN json_extract(msg.value, '$.content') LIKE '%name="tool_delete_event_post"%' THEN 'google_calendar'
            WHEN json_extract(msg.value, '$.content') LIKE '%name="tool_modify_event_post"%' THEN 'google_calendar'
            WHEN json_extract(msg.value, '$.content') LIKE '%name="tool_get_gmail%"%' THEN 'gmail'
            WHEN json_extract(msg.value, '$.content') LIKE '%name="tool_search_gmail%"%' THEN 'gmail'
            WHEN json_extract(msg.value, '$.content') LIKE '%name="tool_send_gmail%"%' THEN 'gmail'
            WHEN json_extract(msg.value, '$.content') LIKE '%name="tool_draft_gmail%"%' THEN 'gmail'
            WHEN json_extract(msg.value, '$.content') LIKE '%name="tool_modify_gmail%"%' THEN 'gmail'
            WHEN json_extract(msg.value, '$.content') LIKE '%name="get_today_tasks"%' THEN 'todoist'
            WHEN json_extract(msg.value, '$.content') LIKE '%name="get_upcoming_tasks"%' THEN 'todoist'
            WHEN json_extract(msg.value, '$.content') LIKE '%name="get_todoist_tasks"%' THEN 'todoist'
            WHEN json_extract(msg.value, '$.content') LIKE '%name="resolve_todoist_task"%' THEN 'todoist'
            WHEN json_extract(msg.value, '$.content') LIKE '%name="get_current_weather"%' THEN 'accuweather'
            WHEN json_extract(msg.value, '$.content') LIKE '%name="get_future_weather%"%' THEN 'accuweather'
            WHEN json_extract(msg.value, '$.content') LIKE '%name="tool_search_drive%"%' THEN 'google_drive'
            WHEN json_extract(msg.value, '$.content') LIKE '%name="tool_get_drive%"%' THEN 'google_drive'
            WHEN json_extract(msg.value, '$.content') LIKE '%name="tool_create_drive%"%' THEN 'google_drive'
            WHEN json_extract(msg.value, '$.content') LIKE '%name="tool_list_drive%"%' THEN 'google_drive'
            WHEN json_extract(msg.value, '$.content') LIKE '%name="tool_search_docs%"%' THEN 'google_docs'
            WHEN json_extract(msg.value, '$.content') LIKE '%name="tool_get_doc%"%' THEN 'google_docs'
            WHEN json_extract(msg.value, '$.content') LIKE '%name="tool_create_doc%"%' THEN 'google_docs'
            WHEN json_extract(msg.value, '$.content') LIKE '%name="slack_%"%' THEN 'slack'
            WHEN json_extract(msg.value, '$.content') LIKE '%name="tool_list_spaces%"%' THEN 'google_spaces'
            WHEN json_extract(msg.value, '$.content') LIKE '%quantbook%"%' OR json_extract(msg.value, '$.content') LIKE '%quantconnect%"%' THEN 'quantconnect'
            ELSE NULL
          END as tool_name
        FROM chat c,
             json_each(json_extract(c.chat, '$.history.messages')) as msg
        WHERE json_extract(msg.value, '$.content') LIKE '%<details type="tool_calls"%'
          AND json_extract(msg.value, '$.content') LIKE '%done="true"%'
      )
      SELECT 
        tool_name,
        COUNT(*) as usage_count,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(DISTINCT chat_id) as unique_chats,
        'custom' as tool_type
      FROM tool_extracts 
      WHERE tool_name IS NOT NULL
      GROUP BY tool_name
    `
    
    if (isPostgreSQL) {
      builtinQuery = `
        SELECT 
          status->>'action' as tool_name,
          COUNT(*) as usage_count,
          COUNT(DISTINCT c.user_id) as unique_users,
          COUNT(DISTINCT c.id) as unique_chats,
          'builtin' as tool_type
        FROM chat c,
             jsonb_array_elements(c.chat->'history'->'messages') as msg,
             jsonb_array_elements(msg->'statusHistory') as status
        WHERE status->>'action' IS NOT NULL
          AND (status->>'done')::int = 1
        GROUP BY tool_name
      `
      
      customQuery = `
        WITH tool_extracts AS (
          SELECT DISTINCT
            c.user_id,
            c.id as chat_id,
            CASE 
              WHEN msg->>'content' LIKE '%name="tool_get_events_post"%' THEN 'google_calendar'
              WHEN msg->>'content' LIKE '%name="tool_list_calendars_post"%' THEN 'google_calendar' 
              WHEN msg->>'content' LIKE '%name="tool_create_event_post"%' THEN 'google_calendar'
              WHEN msg->>'content' LIKE '%name="tool_delete_event_post"%' THEN 'google_calendar'
              WHEN msg->>'content' LIKE '%name="tool_modify_event_post"%' THEN 'google_calendar'
              WHEN msg->>'content' LIKE '%name="tool_get_gmail%"%' THEN 'gmail'
              WHEN msg->>'content' LIKE '%name="tool_search_gmail%"%' THEN 'gmail'
              WHEN msg->>'content' LIKE '%name="tool_send_gmail%"%' THEN 'gmail'
              WHEN msg->>'content' LIKE '%name="tool_draft_gmail%"%' THEN 'gmail'
              WHEN msg->>'content' LIKE '%name="tool_modify_gmail%"%' THEN 'gmail'
              WHEN msg->>'content' LIKE '%name="get_today_tasks"%' THEN 'todoist'
              WHEN msg->>'content' LIKE '%name="get_upcoming_tasks"%' THEN 'todoist'
              WHEN msg->>'content' LIKE '%name="get_todoist_tasks"%' THEN 'todoist'
              WHEN msg->>'content' LIKE '%name="resolve_todoist_task"%' THEN 'todoist'
              WHEN msg->>'content' LIKE '%name="get_current_weather"%' THEN 'accuweather'
              WHEN msg->>'content' LIKE '%name="get_future_weather%"%' THEN 'accuweather'
              WHEN msg->>'content' LIKE '%name="tool_search_drive%"%' THEN 'google_drive'
              WHEN msg->>'content' LIKE '%name="tool_get_drive%"%' THEN 'google_drive'
              WHEN msg->>'content' LIKE '%name="tool_create_drive%"%' THEN 'google_drive'
              WHEN msg->>'content' LIKE '%name="tool_list_drive%"%' THEN 'google_drive'
              WHEN msg->>'content' LIKE '%name="tool_search_docs%"%' THEN 'google_docs'
              WHEN msg->>'content' LIKE '%name="tool_get_doc%"%' THEN 'google_docs'
              WHEN msg->>'content' LIKE '%name="tool_create_doc%"%' THEN 'google_docs'
              WHEN msg->>'content' LIKE '%name="slack_%"%' THEN 'slack'
              WHEN msg->>'content' LIKE '%name="tool_list_spaces%"%' THEN 'google_spaces'
              WHEN msg->>'content' LIKE '%quantbook%"%' OR msg->>'content' LIKE '%quantconnect%"%' THEN 'quantconnect'
              ELSE NULL
            END as tool_name
          FROM chat c,
               jsonb_array_elements(c.chat->'history'->'messages') as msg
          WHERE msg->>'content' LIKE '%<details type="tool_calls"%'
            AND msg->>'content' LIKE '%done="true"%'
        )
        SELECT 
          tool_name,
          COUNT(*) as usage_count,
          COUNT(DISTINCT user_id) as unique_users,
          COUNT(DISTINCT chat_id) as unique_chats,
          'custom' as tool_type
        FROM tool_extracts 
        WHERE tool_name IS NOT NULL
        GROUP BY tool_name
      `
    }
    
    const builtinTools = await executeQuery(builtinQuery)
    const customTools = await executeQuery(customQuery)
    
    // Combine and sort all tools
    const allTools = [...builtinTools, ...customTools]
      .sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, 20)
    
    res.json(allTools)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// SPA fallback - serve index.html for all non-API routes in production
if (fs.existsSync(distPath)) {
  app.get('*', (req, res) => {
    res.sendFile(join(distPath, 'index.html'))
  })
}

const PORT = process.env.PORT || 3080
app.listen(PORT, () => {
  console.log(`Analytics API server running on port ${PORT}`)
})
