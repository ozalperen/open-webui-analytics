# Open WebUI Database Structure Guide

## Overview

Open WebUI uses a relational database (SQLite or PostgreSQL) to store chat data, user information, and configuration. The database leverages JSON columns extensively for flexible data storage, making it particularly suitable for analytics extraction while maintaining schema flexibility.

## Core Tables

### 1. `chat` Table (Primary Analytics Source)
The central table for all chat conversations containing rich metadata for analytics.

| Column | Type | Description |
|--------|------|-------------|
| `id` | String (PK) | Unique chat identifier (UUID) |
| `user_id` | String | User who owns the chat |
| `title` | Text | Chat title |
| `chat` | JSON | Complete chat data including messages and model information |
| `created_at` | BigInteger | Creation timestamp (epoch) |
| `updated_at` | BigInteger | Last update timestamp (epoch) |
| `share_id` | Text | ID for shared chats (nullable) |
| `archived` | Boolean | Archive status |
| `pinned` | Boolean | Pin status |
| `meta` | JSON | Metadata including tags |
| `folder_id` | Text | Folder organization (nullable) |

#### Chat JSON Structure
The `chat` column contains a JSON object with the following structure:
```json
{
  "title": "Chat Title",
  "history": {
    "messages": {
      "message_id": {
        "id": "unique_message_id",
        "role": "user|assistant",
        "content": "message content",
        "model": "model_identifier",  // Key for analytics
        "timestamp": 1234567890,
        "models": ["model1", "model2"],  // When multiple models used
        "statusHistory": [...]
      }
    },
    "currentId": "latest_message_id"
  }
}
```

### 2. `user` Table
Stores user information and settings.

| Column | Type | Description |
|--------|------|-------------|
| `id` | String (PK) | User identifier |
| `name` | String | Display name |
| `email` | String | Email address |
| `role` | String | User role (admin, user, pending) |
| `profile_image_url` | Text | Profile image URL |
| `last_active_at` | BigInteger | Last activity timestamp |
| `created_at` | BigInteger | Account creation timestamp |
| `updated_at` | BigInteger | Last update timestamp |
| `api_key` | String | API key (unique, nullable) |
| `settings` | JSON | User preferences |
| `info` | JSON | Additional user information |
| `oauth_sub` | Text | OAuth subject identifier |

### 3. `model` Table
Manages AI model configurations.

| Column | Type | Description |
|--------|------|-------------|
| `id` | Text (PK) | Model identifier used in API |
| `user_id` | Text | Creator/owner of model config |
| `base_model_id` | Text | Points to actual model (nullable) |
| `name` | Text | Human-readable model name |
| `params` | JSON | Model parameters |
| `meta` | JSON | Model metadata |
| `access_control` | JSON | Access permissions |
| `is_active` | Boolean | Active status |
| `created_at` | BigInteger | Creation timestamp |
| `updated_at` | BigInteger | Update timestamp |

### 4. `tag` Table
Chat categorization system.

| Column | Type | Description |
|--------|------|-------------|
| `id` | String | Tag identifier (name_based) |
| `name` | String | Display name |
| `user_id` | String | Tag owner |
| `meta` | JSON | Tag metadata |

Primary Key: Composite (`id`, `user_id`)

### 5. `folder` Table
Hierarchical chat organization.

| Column | Type | Description |
|--------|------|-------------|
| `id` | Text (PK) | Folder identifier |
| `parent_id` | Text | Parent folder (nullable) |
| `user_id` | Text | Folder owner |
| `name` | Text | Folder name |
| `items` | JSON | Folder contents |
| `meta` | JSON | Folder metadata |
| `is_expanded` | Boolean | UI state |
| `created_at` | BigInteger | Creation timestamp |
| `updated_at` | BigInteger | Update timestamp |

### 6. `message` Table
Channel-based messaging system (separate from chat messages).

| Column | Type | Description |
|--------|------|-------------|
| `id` | Text (PK) | Message identifier |
| `user_id` | Text | Message author |
| `channel_id` | Text | Channel identifier |
| `parent_id` | Text | Thread parent (nullable) |
| `content` | Text | Message content |
| `data` | JSON | Additional data |
| `meta` | JSON | Message metadata |
| `created_at` | BigInteger | Creation timestamp (nanoseconds) |
| `updated_at` | BigInteger | Update timestamp (nanoseconds) |

### 7. `group` Table
User group management for access control.

| Column | Type | Description |
|--------|------|-------------|
| `id` | Text (PK) | Group identifier |
| `user_id` | Text | Group creator |
| `name` | Text | Group name |
| `description` | Text | Group description |
| `permissions` | JSON | Group permissions |
| `user_ids` | JSON | Array of member user IDs |
| `created_at` | BigInteger | Creation timestamp |
| `updated_at` | BigInteger | Update timestamp |

## Key Relationships

1. **User → Chat**: One-to-Many
   - `chat.user_id` → `user.id`
   - Users own multiple chats

2. **Chat → Tag**: Many-to-Many (via JSON)
   - Tags stored in `chat.meta.tags[]`
   - References `tag.id`

3. **Chat → Folder**: Many-to-One
   - `chat.folder_id` → `folder.id`
   - Chats can be organized in folders

4. **Folder → Folder**: Self-referential
   - `folder.parent_id` → `folder.id`
   - Supports nested folder hierarchy

5. **User → Group**: Many-to-Many (via JSON)
   - Users listed in `group.user_ids[]`
   - Groups control access permissions

6. **Message → Message**: Self-referential
   - `message.parent_id` → `message.id`
   - Supports threaded conversations

## Analytics Extraction Queries

### 1. Model Usage Analytics
```sql
-- Extract model usage from chat JSON (PostgreSQL)
SELECT 
    user_id,
    created_at,
    updated_at,
    json_array_elements(chat->'history'->'messages')->>'model' as model_used,
    COUNT(*) as usage_count
FROM chat
WHERE chat->'history'->'messages' IS NOT NULL
GROUP BY user_id, model_used, created_at, updated_at;
```

### 2. Chat Activity Metrics
```sql
-- User activity over time
SELECT 
    user_id,
    DATE(datetime(created_at, 'unixepoch')) as chat_date,
    COUNT(*) as chat_count,
    COUNT(CASE WHEN archived = true THEN 1 END) as archived_count,
    COUNT(CASE WHEN pinned = true THEN 1 END) as pinned_count
FROM chat
GROUP BY user_id, chat_date
ORDER BY chat_date DESC;
```

### 3. Tag Usage Analysis
```sql
-- Tag popularity (SQLite)
SELECT 
    tag_value,
    COUNT(*) as usage_count
FROM chat, json_each(chat.meta, '$.tags') as tag_value
WHERE tag_value.value IS NOT NULL
GROUP BY tag_value
ORDER BY usage_count DESC;
```

### 4. Model Performance Tracking
```sql
-- Messages per model with timestamps
SELECT 
    m.value->>'model' as model_name,
    COUNT(*) as message_count,
    MIN(c.created_at) as first_use,
    MAX(c.updated_at) as last_use
FROM chat c,
     json_each(c.chat->'history'->'messages') as m
WHERE m.value->>'model' IS NOT NULL
GROUP BY model_name;
```

### 5. User Engagement Metrics
```sql
-- User engagement statistics
SELECT 
    u.id,
    u.name,
    u.role,
    COUNT(DISTINCT c.id) as total_chats,
    COUNT(DISTINCT DATE(datetime(c.created_at, 'unixepoch'))) as active_days,
    MAX(c.updated_at) as last_chat_activity,
    u.last_active_at
FROM user u
LEFT JOIN chat c ON u.id = c.user_id
GROUP BY u.id, u.name, u.role;
```

## Best Practices for Analytics

1. **Model Information Extraction**
   - Parse the JSON `chat.chat` column to extract model usage
   - Look for both `model` and `models` fields in messages
   - Track model switches within conversations

2. **Time-Series Analysis**
   - Use `created_at` and `updated_at` timestamps (Unix epoch)
   - Convert to proper datetime for reporting
   - Consider timezone normalization

3. **Performance Optimization**
   - Create indexes on frequently queried JSON paths
   - Consider materialized views for complex analytics
   - Use database-specific JSON functions

4. **Data Quality**
   - Handle null values in JSON fields
   - Validate model identifiers against the `model` table
   - Account for archived and deleted content

## Database-Specific Considerations

### SQLite
- Uses JSON1 extension for JSON queries
- Limited concurrent write performance
- Suitable for single-instance deployments

### PostgreSQL
- Native JSONB support with indexing
- Better concurrent performance
- Supports advanced JSON operations and indexing

## Migration History

The database schema has evolved through migrations:
- Initial schema with basic tables
- Addition of JSON column types for flexibility
- Introduction of folders and groups for organization
- Enhanced metadata and analytics capabilities

## Security Considerations

1. **Access Control**
   - User roles: admin, user, pending
   - Group-based permissions
   - Per-model access control

2. **Data Privacy**
   - User-owned data isolation
   - Shared chat mechanism with separate IDs
   - API key authentication

## Conclusion

The Open WebUI database structure is designed for flexibility and analytics. The extensive use of JSON columns allows for:
- Rich metadata storage
- Flexible schema evolution
- Detailed analytics extraction
- Model usage tracking

This structure enables building comprehensive analytics platforms while maintaining the ability to adapt to new requirements without major schema changes.