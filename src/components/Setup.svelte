<script>
  let activeTab = 'sqlite'
  let message = ''
  let messageType = ''
  
  // SQLite form data
  let sqlitePath = ''
  
  // Common default paths for Open WebUI
  const defaultPaths = [
    '/app/backend/data/webui.db',  // Docker default
    '~/.local/share/open-webui/webui.db',  // Linux default
    './backend/data/webui.db',  // Development
    './webui.db'  // Local file
  ]
  
  // PostgreSQL form data
  let pgHost = 'localhost'
  let pgPort = 5432
  let pgDatabase = ''
  let pgUsername = ''
  let pgPassword = ''
  
  function switchTab(tabName) {
    activeTab = tabName
    message = ''
  }
  
  function showMessage(msg, type) {
    message = msg
    messageType = type
  }
  
  function setDefaultPath(path) {
    sqlitePath = path
    message = ''
  }
  
  async function testPath(path) {
    try {
      const response = await fetch('/setup/test-sqlite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ filePath: path })
      })
      
      const result = await response.json()
      return response.ok
    } catch (error) {
      return false
    }
  }
  
  async function findDefaultPath() {
    showMessage('Searching for database file...', 'success')
    
    for (const path of defaultPaths) {
      const exists = await testPath(path)
      if (exists) {
        sqlitePath = path
        showMessage(`Found database at: ${path}`, 'success')
        return
      }
    }
    
    showMessage('No database found at default locations. Please enter the path manually.', 'error')
  }
  
  async function submitSQLite() {
    if (!sqlitePath) {
      showMessage('Please select a database file', 'error')
      return
    }
    
    try {
      const response = await fetch('/setup/configure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'sqlite',
          config: { filePath: sqlitePath }
        })
      })
      
      const result = await response.json()
      
      if (response.ok) {
        showMessage(result.message, 'success')
        setTimeout(() => {
          restartServer()
        }, 1000)
      } else {
        showMessage(result.error, 'error')
      }
    } catch (error) {
      showMessage('Connection failed: ' + error.message, 'error')
    }
  }
  
  async function submitPostgreSQL() {
    if (!pgHost || !pgPort || !pgDatabase || !pgUsername || !pgPassword) {
      showMessage('Please fill in all fields', 'error')
      return
    }
    
    const config = {
      host: pgHost,
      port: pgPort,
      database: pgDatabase,
      username: pgUsername,
      password: pgPassword
    }
    
    try {
      const response = await fetch('/setup/configure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'postgresql',
          config
        })
      })
      
      const result = await response.json()
      
      if (response.ok) {
        showMessage(result.message, 'success')
        setTimeout(() => {
          restartServer()
        }, 1000)
      } else {
        showMessage(result.error, 'error')
      }
    } catch (error) {
      showMessage('Connection failed: ' + error.message, 'error')
    }
  }
  
  async function restartServer() {
    try {
      await fetch('/setup/restart', { method: 'POST' })
      showMessage('Server is restarting... Please wait...', 'success')
      setTimeout(() => {
        window.location.reload()
      }, 3000)
    } catch (error) {
      showMessage('Server restarted. Please refresh the page manually.', 'success')
    }
  }
</script>

<div class="setup-container">
  <div class="setup-header">
    <h1>Database Configuration</h1>
    <p>Configure your database connection to start using Open WebUI Analytics.</p>
  </div>
  
  {#if message}
    <div class="message {messageType}">
      {message}
    </div>
  {/if}
  
  <div class="tab-buttons">
    <button 
      class="tab-button" 
      class:active={activeTab === 'sqlite'}
      on:click={() => switchTab('sqlite')}
    >
      SQLite
    </button>
    <button 
      class="tab-button" 
      class:active={activeTab === 'postgresql'}
      on:click={() => switchTab('postgresql')}
    >
      PostgreSQL
    </button>
  </div>
  
  {#if activeTab === 'sqlite'}
    <div class="tab-content">
      <div class="form-group">
        <label for="sqlite-path">Open WebUI Database File Path:</label>
        <div class="path-input-section">
          <input 
            type="text" 
            id="sqlite-path" 
            placeholder="/path/to/webui.db" 
            bind:value={sqlitePath}
            required
          >
          <button 
            type="button" 
            class="action-btn" 
            on:click={findDefaultPath}
          >
            🔍 Auto-Find
          </button>
        </div>
        <small>Enter the full path to your webui.db file</small>
      </div>
      
      <div class="default-paths">
        <label>Common locations:</label>
        <div class="path-buttons">
          {#each defaultPaths as path}
            <button 
              type="button" 
              class="path-btn" 
              on:click={() => setDefaultPath(path)}
            >
              {path}
            </button>
          {/each}
        </div>
      </div>
      
      <button type="button" class="submit-btn" on:click={submitSQLite}>
        Configure SQLite
      </button>
    </div>
  {:else}
    <div class="tab-content">
      <div class="form-group">
        <label for="pg-host">Host:</label>
        <input type="text" id="pg-host" bind:value={pgHost} required>
      </div>
      <div class="form-group">
        <label for="pg-port">Port:</label>
        <input type="number" id="pg-port" bind:value={pgPort} required>
      </div>
      <div class="form-group">
        <label for="pg-database">Database:</label>
        <input type="text" id="pg-database" bind:value={pgDatabase} required>
      </div>
      <div class="form-group">
        <label for="pg-username">Username:</label>
        <input type="text" id="pg-username" bind:value={pgUsername} required>
      </div>
      <div class="form-group">
        <label for="pg-password">Password:</label>
        <input type="password" id="pg-password" bind:value={pgPassword} required>
      </div>
      <button type="button" class="submit-btn" on:click={submitPostgreSQL}>
        Configure PostgreSQL
      </button>
    </div>
  {/if}
</div>

<style>
  .setup-container {
    max-width: 600px;
    margin: 0 auto;
    padding: 2rem;
  }
  
  .setup-header {
    text-align: center;
    margin-bottom: 2rem;
  }
  
  .setup-header h1 {
    color: var(--text-primary);
    margin-bottom: 0.5rem;
    font-size: 2rem;
  }
  
  .setup-header p {
    color: var(--text-secondary);
    font-size: 1rem;
  }
  
  .tab-buttons {
    display: flex;
    margin-bottom: 2rem;
    border-bottom: 1px solid var(--border);
  }
  
  .tab-button {
    flex: 1;
    padding: 1rem;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1rem;
    color: var(--text-secondary);
    border-bottom: 2px solid transparent;
    transition: all 0.3s ease;
  }
  
  .tab-button.active {
    color: var(--accent);
    border-bottom-color: var(--accent);
  }
  
  .tab-button:hover {
    color: var(--text-primary);
  }
  
  .tab-content {
    animation: fadeIn 0.3s ease;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .form-group {
    margin-bottom: 1.5rem;
  }
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: var(--text-primary);
  }
  
  input[type="text"], 
  input[type="password"], 
  input[type="number"] {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--border);
    border-radius: 6px;
    font-size: 1rem;
    background: var(--bg-primary);
    color: var(--text-primary);
    transition: border-color 0.3s ease;
  }
  
  input:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }
  
  .path-input-section {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }
  
  .path-input-section input[type="text"] {
    flex: 1;
  }
  
  .action-btn {
    padding: 0.75rem 1rem;
    background: var(--accent);
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    transition: background-color 0.3s ease;
    white-space: nowrap;
  }
  
  .action-btn:hover {
    background: #2563eb;
  }
  
  .default-paths {
    margin-bottom: 1.5rem;
  }
  
  .default-paths label {
    display: block;
    margin-bottom: 0.75rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-primary);
  }
  
  .path-buttons {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .path-btn {
    padding: 0.5rem 0.75rem;
    background: var(--bg-tertiary);
    color: var(--text-secondary);
    border: 1px solid var(--border);
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.875rem;
    text-align: left;
    transition: all 0.3s ease;
    font-family: monospace;
  }
  
  .path-btn:hover {
    background: var(--bg-secondary);
    color: var(--text-primary);
    border-color: var(--accent);
  }
  
  .submit-btn {
    width: 100%;
    padding: 1rem;
    background: #10b981;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }
  
  .submit-btn:hover {
    background: #059669;
  }
  
  .submit-btn:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
  
  .message {
    padding: 1rem;
    border-radius: 6px;
    margin-bottom: 1.5rem;
    font-weight: 500;
  }
  
  .message.success {
    background: #d1fae5;
    color: #065f46;
    border: 1px solid #a7f3d0;
  }
  
  .message.error {
    background: #fee2e2;
    color: #991b1b;
    border: 1px solid #fecaca;
  }
  
  small {
    display: block;
    margin-top: 0.25rem;
    color: var(--text-secondary);
    font-size: 0.875rem;
  }
</style>