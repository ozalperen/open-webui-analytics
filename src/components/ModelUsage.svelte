<script>
  import { onMount } from 'svelte'
  import { api } from '../lib/api.js'
  
  let models = []
  let loading = true
  let error = null
  let viewMode = 'cards' // 'cards' or 'list'
  
  onMount(async () => {
    try {
      models = await api.getModelUsage()
    } catch (e) {
      error = e.message
    } finally {
      loading = false
    }
  })
  
  function getBarWidth(count, maxCount) {
    return `${(count / maxCount) * 100}%`
  }
  
  function getRankBadgeClass(rank) {
    if (rank === 1) return 'rank-gold'
    if (rank === 2) return 'rank-silver' 
    if (rank === 3) return 'rank-bronze'
    return 'rank-default'
  }
  
  function formatUsageCount(count) {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
    return count.toLocaleString()
  }
</script>

<div class="model-usage">
  <div class="section-header">
    <h2>Model Usage Distribution</h2>
    <p>Popularity and usage patterns of AI models across your platform</p>
  </div>
  
  <div class="view-controls">
    <div class="view-toggle">
      <button 
        class="btn {viewMode === 'cards' ? 'btn-primary' : 'btn-secondary'}"
        on:click={() => viewMode = 'cards'}
      >
        <span class="toggle-icon">🃏</span>
        Cards
      </button>
      <button 
        class="btn {viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}"
        on:click={() => viewMode = 'list'}
      >
        <span class="toggle-icon">📋</span>
        List
      </button>
    </div>
  </div>
  
  {#if loading}
    <div class="loading-state">
      <div class="loading-spinner"></div>
      <p>Analyzing model usage...</p>
    </div>
  {:else if error}
    <div class="error-state">
      <div class="error-icon">⚠️</div>
      <h3>Unable to Load Model Data</h3>
      <p>{error}</p>
    </div>
  {:else if models.length > 0}
    <div class="models-container fade-in">
      {#if viewMode === 'cards'}
        <div class="models-grid">
          {#each models as model, i}
            <div class="model-card slide-up" style="animation-delay: {i * 0.1}s">
              <div class="model-header">
                <div class="model-rank">
                  <span class="rank-badge {getRankBadgeClass(i + 1)}">
                    #{i + 1}
                  </span>
                </div>
                <div class="model-info">
                  <h3 class="model-name">{model.model || 'Unknown Model'}</h3>
                  <div class="model-stats">
                    <span class="usage-count">{formatUsageCount(model.usage_count)}</span>
                    <span class="usage-label">messages</span>
                    <span class="token-count">~{formatUsageCount(model.estimated_tokens || 0)} tokens</span>
                  </div>
                </div>
              </div>
              
              <div class="usage-bar-container">
                <div 
                  class="usage-bar" 
                  style="width: {getBarWidth(model.usage_count, models[0].usage_count)}"
                ></div>
              </div>
              
              <div class="model-details">
                <div class="detail-item">
                  <span class="detail-label">Market Share</span>
                  <span class="detail-value">
                    {((model.usage_count / models.reduce((sum, m) => sum + m.usage_count, 0)) * 100).toFixed(1)}%
                  </span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Est. Tokens</span>
                  <span class="detail-value">{formatUsageCount(model.estimated_tokens || 0)}</span>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <div class="models-list">
          {#each models as model, i}
            <div class="model-list-item slide-up" style="animation-delay: {i * 0.05}s">
              <div class="list-item-content">
                <div class="list-item-left">
                  <span class="rank-badge {getRankBadgeClass(i + 1)}">#{i + 1}</span>
                  <div class="model-info-compact">
                    <span class="model-name-compact">{model.model || 'Unknown Model'}</span>
                    <span class="model-count-compact">{model.usage_count.toLocaleString()} messages • ~{formatUsageCount(model.estimated_tokens || 0)} tokens</span>
                  </div>
                </div>
                <div class="list-item-right">
                  <span class="market-share">
                    {((model.usage_count / models.reduce((sum, m) => sum + m.usage_count, 0)) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div class="list-item-bar-container">
                <div 
                  class="list-item-bar" 
                  style="width: {getBarWidth(model.usage_count, models[0].usage_count)}"
                ></div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
      
      <div class="summary-card">
        <h3>Usage Summary</h3>
        <div class="summary-stats">
          <div class="summary-item">
            <span class="summary-value">{models.length}</span>
            <span class="summary-label">Models Active</span>
          </div>
          <div class="summary-item">
            <span class="summary-value">
              {formatUsageCount(models.reduce((sum, m) => sum + (m.estimated_tokens || 0), 0))}
            </span>
            <span class="summary-label">Total Tokens</span>
          </div>
          <div class="summary-item">
            <span class="summary-value">
              {models[0] ? models[0].model.split('/').pop() || models[0].model : 'N/A'}
            </span>
            <span class="summary-label">Most Popular</span>
          </div>
        </div>
      </div>
    </div>
  {:else}
    <div class="empty-state">
      <div class="empty-icon">🤖</div>
      <h3>No Model Data Available</h3>
      <p>Start using your AI models to see usage statistics here.</p>
    </div>
  {/if}
</div>

<style>
  .model-usage {
    min-height: 400px;
  }
  
  .section-header {
    text-align: center;
    margin-bottom: 2rem;
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
  
  .view-controls {
    display: flex;
    justify-content: center;
    margin-bottom: 2rem;
  }
  
  .view-toggle {
    display: flex;
    gap: 0.5rem;
    background: var(--bg-secondary);
    padding: 0.5rem;
    border-radius: 8px;
    border: 1px solid var(--border);
  }
  
  .toggle-icon {
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
  
  .models-container {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }
  
  /* Card View Styles */
  .models-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 1.5rem;
  }
  
  .model-card {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1.5rem;
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px var(--shadow);
  }
  
  .model-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px var(--shadow);
  }
  
  .model-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }
  
  .model-rank {
    flex-shrink: 0;
  }
  
  .rank-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    font-size: 0.75rem;
    font-weight: 700;
  }
  
  .rank-gold {
    background: #fbbf24;
    color: #92400e;
  }
  
  .rank-silver {
    background: #d1d5db;
    color: #374151;
  }
  
  .rank-bronze {
    background: #f59e0b;
    color: #92400e;
  }
  
  .rank-default {
    background: var(--bg-tertiary);
    color: var(--text-secondary);
  }
  
  .model-info {
    flex: 1;
    min-width: 0;
  }
  
  .model-name {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 0.25rem 0;
    word-break: break-word;
  }
  
  .model-stats {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
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
  
  .token-count {
    font-size: 0.75rem;
    color: var(--text-muted);
    font-weight: 500;
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
  
  .model-details {
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
  
  /* List View Styles */
  .models-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .model-list-item {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 1rem;
    transition: all 0.3s ease;
    box-shadow: 0 1px 3px var(--shadow);
  }
  
  .model-list-item:hover {
    transform: translateX(4px);
    box-shadow: 0 4px 12px var(--shadow);
  }
  
  .list-item-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.5rem;
  }
  
  .list-item-left {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex: 1;
    min-width: 0;
  }
  
  .model-info-compact {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    min-width: 0;
  }
  
  .model-name-compact {
    font-weight: 600;
    color: var(--text-primary);
    font-size: 1rem;
    word-break: break-word;
  }
  
  .model-count-compact {
    font-size: 0.875rem;
    color: var(--text-secondary);
  }
  
  .list-item-right {
    flex-shrink: 0;
    margin-left: 1rem;
  }
  
  .market-share {
    font-size: 1rem;
    font-weight: 700;
    color: var(--accent);
  }
  
  .list-item-bar-container {
    width: 100%;
    height: 4px;
    background: var(--bg-tertiary);
    border-radius: 2px;
    overflow: hidden;
  }
  
  .list-item-bar {
    height: 100%;
    background: linear-gradient(90deg, var(--accent), var(--accent-hover));
    border-radius: 2px;
    transition: width 0.8s ease;
  }
  
  /* Summary Card */
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
    .view-controls {
      margin: 0 1rem 2rem;
    }
    
    .view-toggle {
      width: 100%;
      justify-content: center;
    }
    
    .models-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
    }
    
    .model-card {
      padding: 1.25rem;
    }
    
    .model-details {
      grid-template-columns: 1fr;
      gap: 0.75rem;
    }
    
    .model-list-item {
      padding: 0.875rem;
    }
    
    .list-item-left {
      gap: 0.75rem;
    }
    
    .list-item-right {
      margin-left: 0.5rem;
    }
    
    .summary-stats {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }
  }
</style>