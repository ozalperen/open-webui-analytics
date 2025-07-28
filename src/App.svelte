<script>
  import { onMount } from 'svelte'
  import Overview from './components/Overview.svelte'
  import ModelUsage from './components/ModelUsage.svelte'
  import ActivityChart from './components/ActivityChart.svelte'
  import UserStats from './components/UserStats.svelte'
  import ToolUsage from './components/ToolUsage.svelte'
  import Setup from './components/Setup.svelte'

  let activeTab = 'overview'
  let setupMode = false
  let checkingSetup = true
  
  onMount(async () => {
    // Check if server is in setup mode
    try {
      const response = await fetch('/api/stats/overview')
      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        if (errorData?.setupRequired) {
          setupMode = true
        }
      }
    } catch (error) {
      // If we can't reach API, assume setup might be needed
      try {
        const setupResponse = await fetch('/setup')
        if (setupResponse.ok) {
          setupMode = true
        }
      } catch (setupError) {
        // Ignore
      }
    }
    checkingSetup = false
  })

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'models', label: 'Model Usage', icon: '🤖' },
    { id: 'activity', label: 'Activity', icon: '📈' },
    { id: 'tools', label: 'Tools', icon: '🛠️' },
    { id: 'users', label: 'Users', icon: '👥' }
  ]
</script>

<div class="app">
  <header class="hero">
    <div class="container">
      <div class="hero-content fade-in">
        <h1>Open WebUI Analytics</h1>
        <p>Real-time insights into your Open WebUI instance</p>
      </div>
    </div>
  </header>

  {#if !checkingSetup && !setupMode}
    <nav class="navigation">
      <div class="container">
        <div class="nav-tabs slide-up">
          {#each tabs as tab}
            <button
              class="btn {activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}"
              on:click={() => activeTab = tab.id}
            >
              <span class="tab-icon">{tab.icon}</span>
              {tab.label}
            </button>
          {/each}
        </div>
      </div>
    </nav>
  {/if}

  <main class="main-content">
    <div class="container">
      <div class="content-card fade-in">
        {#if checkingSetup}
          <div class="loading-state">
            <div class="loading-spinner"></div>
            <p>Initializing...</p>
          </div>
        {:else if setupMode}
          <Setup />
        {:else if activeTab === 'overview'}
          <Overview />
        {:else if activeTab === 'models'}
          <ModelUsage />
        {:else if activeTab === 'activity'}
          <ActivityChart />
        {:else if activeTab === 'tools'}
          <ToolUsage />
        {:else if activeTab === 'users'}
          <UserStats />
        {/if}
      </div>
    </div>
  </main>
</div>

<style>
  .app {
    min-height: 100vh;
    background: var(--bg-secondary);
  }

  .hero {
    background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
    color: var(--hero-accent);
    padding: 3rem 0 2rem;
    position: relative;
    overflow: hidden;
  }

  .hero::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") repeat;
    pointer-events: none;
  }

  .hero-content {
    text-align: center;
    position: relative;
    z-index: 1;
  }

  .hero h1 {
    font-size: clamp(2.5rem, 5vw, 4rem);
    font-weight: 800;
    margin: 0 0 1rem 0;
    color: var(--hero-accent);
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .hero p {
    font-size: clamp(1rem, 2vw, 1.25rem);
    color: var(--hero-accent);
    opacity: 0.9;
    max-width: 600px;
    margin: 0 auto;
    line-height: 1.6;
  }

  .navigation {
    background: var(--bg-primary);
    border-bottom: 1px solid var(--border);
    padding: 1.5rem 0;
    box-shadow: 0 2px 4px var(--shadow);
  }

  .nav-tabs {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
  }

  .tab-icon {
    font-size: 1.1rem;
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    text-align: center;
    min-height: 300px;
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
  

  .main-content {
    padding: 3rem 0;
  }

  .content-card {
    background: var(--bg-primary);
    border-radius: 12px;
    box-shadow: 0 4px 6px -1px var(--shadow), 0 2px 4px -1px var(--shadow);
    padding: 2.5rem;
    border: 1px solid var(--border);
  }

  @media (max-width: 768px) {
    .hero {
      padding: 2rem 0 1.5rem;
    }

    .nav-tabs {
      justify-content: flex-start;
      overflow-x: auto;
      padding: 0 0 0.5rem;
      -webkit-overflow-scrolling: touch;
    }

    .nav-tabs button {
      flex-shrink: 0;
    }

    .main-content {
      padding: 2rem 0;
    }

    .content-card {
      padding: 1.5rem;
      margin: 0 1rem;
    }
  }
</style>