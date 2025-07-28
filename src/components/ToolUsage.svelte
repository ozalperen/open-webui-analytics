<script>
  import { onMount } from 'svelte'
  import { api } from '../lib/api.js'
  
  let tools = []
  let loading = true
  let error = null
  
  onMount(async () => {
    try {
      tools = await api.getTools()
    } catch (e) {
      error = e.message
    } finally {
      loading = false
    }
  })
  
  function getToolIcon(toolName, toolType) {
    const icons = {
      // Built-in tools
      'web_search': '🔍',
      'knowledge_search': '📚',
      'code_execution': '💻',
      'file_upload': '📎',
      'image_generation': '🎨',
      'document_processing': '📄',
      'translation': '🌐',
      'calculation': '🧮',
      // Custom tools
      'google_calendar': '📅',
      'gmail': '📧',
      'todoist': '✅',
      'accuweather': '🌤️',
      'google_drive': '💾',
      'google_docs': '📝',
      'slack': '💬',
      'google_spaces': '🏢',
      'quantconnect': '📊'
    }
    return icons[toolName] || (toolType === 'custom' ? '🔧' : '🛠️')
  }
  
  function formatToolName(toolName) {
    return toolName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }
  
  function getBarWidth(count, maxCount) {
    return `${(count / maxCount) * 100}%`
  }
  
  function formatUsageCount(count) {
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
    return count.toString()
  }
</script>

<div class="tool-usage">
  <div class="section-header">
    <h2>Tool Usage Analytics</h2>
    <p>Most popular tools and integrations used across your platform</p>
  </div>
  
  {#if loading}
    <div class="loading-state">
      <div class="loading-spinner"></div>
      <p>Analyzing tool usage...</p>
    </div>
  {:else if error}
    <div class="error-state">
      <div class="error-icon">⚠️</div>
      <h3>Unable to Load Tool Data</h3>
      <p>{error}</p>
    </div>
  {:else if tools.length > 0}
    <div class="tools-container fade-in">
      <div class="tools-grid">
        {#each tools as tool, i}
          <div class="tool-card slide-up" style="animation-delay: {i * 0.1}s">
            <div class="tool-header">
              <div class="tool-icon">
                {getToolIcon(tool.tool_name, tool.tool_type)}
              </div>
              <div class="tool-info">
                <h3 class="tool-name">
                  {formatToolName(tool.tool_name)}
                  {#if tool.tool_type === 'custom'}
                    <span class="tool-badge">Custom</span>
                  {/if}
                </h3>
                <div class="tool-stats">
                  <span class="usage-count">{formatUsageCount(tool.usage_count)}</span>
                  <span class="usage-label">uses</span>
                </div>
              </div>
            </div>
            
            <div class="usage-bar-container">
              <div 
                class="usage-bar" 
                style="width: {getBarWidth(tool.usage_count, tools[0].usage_count)}"
              ></div>
            </div>
            
            <div class="tool-details">
              <div class="detail-item">
                <span class="detail-label">Unique Users</span>
                <span class="detail-value">{tool.unique_users}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">In Chats</span>
                <span class="detail-value">{tool.unique_chats}</span>
              </div>
            </div>
          </div>
        {/each}
      </div>
      
      <div class="summary-card">
        <h3>Tool Usage Summary</h3>
        <div class="summary-stats">
          <div class="summary-item">
            <span class="summary-value">{tools.length}</span>
            <span class="summary-label">Active Tools</span>
          </div>
          <div class="summary-item">
            <span class="summary-value">
              {tools.reduce((sum, t) => sum + t.usage_count, 0).toLocaleString()}
            </span>
            <span class="summary-label">Total Uses</span>
          </div>
          <div class="summary-item">
            <span class="summary-value">
              {tools[0] ? formatToolName(tools[0].tool_name) : 'N/A'}
            </span>
            <span class="summary-label">Most Popular</span>
          </div>
        </div>
      </div>
    </div>
  {:else}
    <div class="empty-state">
      <div class="empty-icon">🛠️</div>
      <h3>No Tool Usage Data</h3>
      <p>No tool activity detected in your conversations.</p>
    </div>
  {/if}
</div>

<style>
  .tool-usage {
    min-height: 400px;
  }
  
  .section-header {
    text-align: center;
    margin-bottom: 3rem;
  }
  
  .section-header h2 {
    font-size: clamp(1.5rem, 3vw, 2rem);
    color: var(--text-primary);
    margin-bottom: 0.5rem;
  }
  
  .section-header p {
    color: var(--text-secondary);
    font-size: 1rem;
  }
  
  .loading-state, .error-state, .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    text-align: center;
  }
  
  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--bg-tertiary);
    border-top: 3px solid var(--accent);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .error-state {
    color: var(--error);
  }
  
  .error-icon, .empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }
  
  .tools-container {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }
  
  .tools-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
  }
  
  .tool-card {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1.5rem;
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px var(--shadow);
  }
  
  .tool-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px var(--shadow);
  }
  
  .tool-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }
  
  .tool-icon {
    width: 48px;
    height: 48px;
    background: var(--bg-tertiary);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    flex-shrink: 0;
    opacity: 0.4;
    filter: grayscale(60%);
  }
  
  .tool-info {
    flex: 1;
    min-width: 0;
  }
  
  .tool-name {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 0.25rem 0;
    word-break: break-word;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .tool-badge {
    background: var(--accent);
    color: white;
    font-size: 0.6rem;
    font-weight: 600;
    padding: 0.15rem 0.4rem;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .tool-stats {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .usage-count {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--accent);
  }
  
  .usage-label {
    font-size: 0.875rem;
    color: var(--text-secondary);
  }
  
  .usage-bar-container {
    width: 100%;
    height: 6px;
    background: var(--bg-tertiary);
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 1rem;
  }
  
  .usage-bar {
    height: 100%;
    background: linear-gradient(90deg, var(--accent), var(--accent-hover));
    border-radius: 3px;
    transition: width 0.8s ease;
  }
  
  .tool-details {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
  
  .detail-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    background: var(--bg-tertiary);
    border-radius: 6px;
  }
  
  .detail-label {
    font-size: 0.75rem;
    color: var(--text-secondary);
    font-weight: 500;
  }
  
  .detail-value {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-primary);
  }
  
  .summary-card {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 2rem;
    box-shadow: 0 2px 4px var(--shadow);
  }
  
  .summary-card h3 {
    color: var(--text-primary);
    margin-bottom: 1.5rem;
    font-size: 1.25rem;
    text-align: center;
  }
  
  .summary-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 2rem;
  }
  
  .summary-item {
    text-align: center;
  }
  
  .summary-value {
    display: block;
    font-size: 1.75rem;
    font-weight: 800;
    color: var(--accent);
    margin-bottom: 0.25rem;
  }
  
  .summary-label {
    font-size: 0.875rem;
    color: var(--text-secondary);
    font-weight: 500;
  }
  
  @media (max-width: 768px) {
    .tools-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
    }
    
    .tool-card {
      padding: 1.25rem;
    }
    
    .tool-details {
      grid-template-columns: 1fr;
      gap: 0.75rem;
    }
    
    .summary-stats {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }
  }
</style>