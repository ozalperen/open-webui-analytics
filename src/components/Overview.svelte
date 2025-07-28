<script>
  import { onMount } from 'svelte'
  import { api } from '../lib/api.js'
  
  let stats = null
  let loading = true
  let error = null
  
  onMount(async () => {
    try {
      stats = await api.getOverview()
    } catch (e) {
      error = e.message
    } finally {
      loading = false
    }
  })
  
  function formatNumber(num, format = 'number') {
    if (format === 'tokens') {
      if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
      if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    }
    return new Intl.NumberFormat().format(num)
  }
  
  const statConfig = [
    {
      key: 'totalUsers',
      label: 'Total Users',
      icon: '👥',
      color: 'var(--text-primary)',
      bgColor: 'var(--bg-tertiary)'
    },
    {
      key: 'totalChats', 
      label: 'Total Chats',
      icon: '💬',
      color: 'var(--text-primary)',
      bgColor: '#e5e7eb'
    },
    {
      key: 'activeUsers',
      label: 'Active Users (30d)',
      icon: '🔥',
      color: 'var(--text-primary)',
      bgColor: '#d1d5db'
    },
    {
      key: 'estimatedTokens',
      label: 'Total Tokens',
      icon: '🪙',
      color: 'var(--text-primary)',
      bgColor: '#9ca3af',
      format: 'tokens'
    },
    {
      key: 'toolUsage',
      label: 'Tool Uses',
      icon: '🛠️',
      color: 'white',
      bgColor: '#6b7280'
    },
    {
      key: 'totalModels',
      label: 'Active Models', 
      icon: '🤖',
      color: 'white',
      bgColor: '#4b5563'
    }
  ]
</script>

<div class="overview">
  {#if loading}
    <div class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading analytics...</p>
    </div>
  {:else if error}
    <div class="error-state">
      <div class="error-icon">⚠️</div>
      <h3>Unable to Load Data</h3>
      <p>{error}</p>
    </div>
  {:else if stats}
    <div class="stats-header">
      <h2>Dashboard Overview</h2>
      <p>Key metrics and insights from your Open WebUI instance</p>
    </div>
    
    <div class="stats-grid fade-in">
      {#each statConfig as config}
        <div class="stat-card slide-up">
          <div class="stat-icon" style="background-color: {config.bgColor}; color: {config.color};">
            {config.icon}
          </div>
          <div class="stat-content">
            <div class="stat-value">{formatNumber(stats[config.key], config.format)}</div>
            <div class="stat-label">{config.label}</div>
          </div>
        </div>
      {/each}
    </div>
    
    <div class="insights-section">
      <div class="insight-card">
        <h3>Quick Insights</h3>
        <div class="insights-grid">
          <div class="insight-item">
            <span class="insight-label">Engagement Rate</span>
            <span class="insight-value">
              {stats.totalChats > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}%
            </span>
          </div>
          <div class="insight-item">
            <span class="insight-label">Avg Tokens per Chat</span>
            <span class="insight-value">
              {stats.totalChats > 0 ? Math.round(stats.estimatedTokens / stats.totalChats).toLocaleString() : 0}
            </span>  
          </div>
          <div class="insight-item">
            <span class="insight-label">Tokens per Active User</span>
            <span class="insight-value">
              {stats.activeUsers > 0 ? formatNumber(Math.round(stats.estimatedTokens / stats.activeUsers), 'tokens') : 0}
            </span>  
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .overview {
    min-height: 400px;
  }
  
  .loading-state, .error-state {
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
  
  .error-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }
  
  .error-state h3 {
    color: var(--error);
    margin-bottom: 0.5rem;
  }
  
  .stats-header {
    text-align: center;
    margin-bottom: 3rem;
  }
  
  .stats-header h2 {
    font-size: clamp(1.5rem, 3vw, 2rem);
    color: var(--text-primary);
    margin-bottom: 0.5rem;
  }
  
  .stats-header p {
    color: var(--text-secondary);
    font-size: 1rem;
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
    margin-bottom: 3rem;
  }
  
  .stat-card {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 2rem;
    display: flex;
    align-items: center;
    gap: 1.5rem;
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px var(--shadow);
  }
  
  .stat-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px var(--shadow);
  }
  
  .stat-icon {
    width: 60px;
    height: 60px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    flex-shrink: 0;
  }
  
  .stat-content {
    flex: 1;
  }
  
  .stat-value {
    font-size: 2.5rem;
    font-weight: 800;
    color: var(--text-primary);
    line-height: 1;
    margin-bottom: 0.25rem;
  }
  
  .stat-label {
    font-size: 0.875rem;
    color: var(--text-secondary);
    font-weight: 500;
  }
  
  .insights-section {
    margin-top: 2rem;
  }
  
  .insight-card {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 2rem;
    box-shadow: 0 2px 4px var(--shadow);
  }
  
  .insight-card h3 {
    color: var(--text-primary);
    margin-bottom: 1.5rem;
    font-size: 1.25rem;
  }
  
  .insights-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 2rem;
  }
  
  .insight-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: var(--bg-tertiary);
    border-radius: 8px;
  }
  
  .insight-label {
    color: var(--text-secondary);
    font-size: 0.875rem;
    font-weight: 500;
  }
  
  .insight-value {
    color: var(--text-primary);
    font-size: 1.25rem;
    font-weight: 700;
  }
  
  @media (max-width: 768px) {
    .stats-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
    }
    
    .stat-card {
      padding: 1.5rem;
    }
    
    .stat-icon {
      width: 50px;
      height: 50px;
      font-size: 1.25rem;
    }
    
    .stat-value {
      font-size: 2rem;
    }
    
    .insights-grid {
      grid-template-columns: 1fr;
      gap: 1rem;  
    }
  }
</style>