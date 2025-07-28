<script>
  import { onMount } from 'svelte'
  import { api } from '../lib/api.js'
  
  let activity = []
  let loading = true
  let error = null
  let days = 30
  
  $: loadActivity(days)
  
  async function loadActivity(dayCount) {
    loading = true
    error = null
    try {
      activity = await api.getActivity(dayCount)
    } catch (e) {
      error = e.message
    } finally {
      loading = false
    }
  }
  
  function getMaxValue() {
    return Math.max(...activity.map(a => a.chat_count), 1)
  }
  
  function formatDate(dateStr) {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  
  function getBarHeight(count, maxCount) {
    return Math.max((count / maxCount) * 200, 2)
  }
  
  function getBarColor(count, maxCount) {
    const intensity = count / maxCount
    if (intensity > 0.8) return 'var(--success)'
    if (intensity > 0.5) return 'var(--accent)'
    if (intensity > 0.2) return 'var(--warning)'
    return 'var(--text-muted)'
  }
</script>

<div class="activity-chart">
  <div class="section-header">
    <h2>Chat Activity Over Time</h2>
    <p>Track conversation patterns and user engagement trends</p>
  </div>
  
  <div class="chart-controls">
    <div class="time-selector">
      <button 
        class="btn {days === 7 ? 'btn-primary' : 'btn-secondary'}" 
        on:click={() => days = 7}
      >
        7 days
      </button>
      <button 
        class="btn {days === 30 ? 'btn-primary' : 'btn-secondary'}" 
        on:click={() => days = 30}
      >
        30 days
      </button>
      <button 
        class="btn {days === 90 ? 'btn-primary' : 'btn-secondary'}" 
        on:click={() => days = 90}
      >
        90 days
      </button>
    </div>
  </div>
  
  {#if loading}
    <div class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading activity data...</p>
    </div>
  {:else if error}  
    <div class="error-state">
      <div class="error-icon">⚠️</div>
      <h3>Unable to Load Activity Data</h3>
      <p>{error}</p>
    </div>
  {:else if activity.length > 0}
    <div class="chart-container fade-in">
      <div class="chart-wrapper">
        <div class="chart">
          {#each activity.slice().reverse() as day, i}
            <div class="chart-column" style="animation-delay: {i * 0.05}s">
              <div 
                class="chart-bar slide-up" 
                style="height: {getBarHeight(day.chat_count, getMaxValue())}px; background-color: {getBarColor(day.chat_count, getMaxValue())}"
                title="{day.chat_count} chats by {day.unique_users} users on {formatDate(day.date)}"
              >
                <div class="bar-value">{day.chat_count}</div>
              </div>
              <div class="chart-label">{formatDate(day.date)}</div>
            </div>
          {/each}
        </div>
      </div>
      
      <div class="stats-summary">
        <div class="summary-grid">
          <div class="summary-card">
            <div class="summary-icon">💬</div>
            <div class="summary-content">
              <div class="summary-value">
                {activity.reduce((sum, d) => sum + d.chat_count, 0).toLocaleString()}
              </div>
              <div class="summary-label">Total Chats</div>
            </div>
          </div>
          
          <div class="summary-card">
            <div class="summary-icon">👥</div>
            <div class="summary-content">
              <div class="summary-value">
                {Math.max(...activity.map(d => d.unique_users))}
              </div>
              <div class="summary-label">Peak Daily Users</div>
            </div>
          </div>
          
          <div class="summary-card">
            <div class="summary-icon">📈</div>
            <div class="summary-content">
              <div class="summary-value">
                {Math.round(activity.reduce((sum, d) => sum + d.chat_count, 0) / activity.length)}
              </div>
              <div class="summary-label">Daily Average</div>
            </div>
          </div>
          
          <div class="summary-card">
            <div class="summary-icon">🏆</div>
            <div class="summary-content">
              <div class="summary-value">
                {Math.max(...activity.map(d => d.chat_count))}
              </div>
              <div class="summary-label">Peak Day</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  {:else}
    <div class="empty-state">
      <div class="empty-icon">📊</div>
      <h3>No Activity Data</h3>
      <p>No chat activity found for the selected time period.</p>
    </div>
  {/if}
</div>

<style>
  .activity-chart {
    min-height: 500px;
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
  
  .chart-controls {
    display: flex;
    justify-content: center;
    margin-bottom: 2rem;
  }
  
  .time-selector {
    display: flex;
    gap: 0.5rem;
    background: var(--bg-secondary);
    padding: 0.5rem;
    border-radius: 8px;
    border: 1px solid var(--border);
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
  
  .chart-container {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }
  
  .chart-wrapper {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 2rem;
    box-shadow: 0 2px 4px var(--shadow);
    overflow-x: auto;
  }
  
  .chart {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    min-width: max-content;
    height: 250px;
    padding: 1rem 0;
  }
  
  .chart-column {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    min-width: 40px;
  }
  
  .chart-bar {
    width: 32px;
    border-radius: 4px 4px 0 0;
    position: relative;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .chart-bar:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  .bar-value {
    position: absolute;
    top: -25px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-primary);
    background: var(--bg-primary);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    border: 1px solid var(--border);
    opacity: 0;
    transition: opacity 0.2s;
    white-space: nowrap;
    z-index: 10;
  }
  
  .chart-bar:hover .bar-value {
    opacity: 1;
  }
  
  .chart-label {
    font-size: 0.7rem;
    color: var(--text-muted);
    font-weight: 500;
    transform: rotate(-45deg);
    transform-origin: center;
    white-space: nowrap;
    margin-top: 0.5rem;
  }
  
  .stats-summary {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 2rem;
    box-shadow: 0 2px 4px var(--shadow);
  }
  
  .summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
  }
  
  .summary-card {
    background: var(--bg-tertiary);
    border-radius: 8px;
    padding: 1.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    transition: all 0.3s ease;
  }
  
  .summary-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px var(--shadow);
  }
  
  .summary-icon {
    font-size: 2rem;
    opacity: 0.4;
    filter: grayscale(60%);
  }
  
  .summary-content {
    flex: 1;
  }
  
  .summary-value {
    font-size: 1.75rem;
    font-weight: 800;
    color: var(--text-primary);
    line-height: 1;
    margin-bottom: 0.25rem;
  }
  
  .summary-label {
    font-size: 0.875rem;
    color: var(--text-secondary);
    font-weight: 500;
  }
  
  @media (max-width: 768px) {
    .chart-controls {
      margin: 0 1rem 2rem;
    }
    
    .time-selector {
      width: 100%;
      justify-content: center;
    }
    
    .chart-wrapper {
      margin: 0 1rem;
      padding: 1.5rem 1rem;
    }
    
    .chart {
      justify-content: flex-start;
      gap: 6px;
    }
    
    .chart-bar {
      width: 24px;
    }
    
    .summary-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
    }
    
    .summary-card {
      padding: 1rem;
    }
    
    .summary-value {
      font-size: 1.5rem;
    }
  }
</style>