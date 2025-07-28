const API_BASE = '/api'

async function fetchAPI(endpoint) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      
      // Check if server is in setup mode
      if (errorData?.setupRequired) {
        window.location.href = '/setup'
        throw new Error('Server is in setup mode')
      }
      
      throw new Error(`API Error: ${response.statusText}`)
    }
    
    return response.json()
  } catch (error) {
    // Handle network errors or JSON parsing errors
    if (error.message.includes('Server is in setup mode')) {
      throw error
    }
    
    // Check if this might be a setup mode issue (HTML response when expecting JSON)
    try {
      const testResponse = await fetch('/setup')
      if (testResponse.ok) {
        window.location.href = '/setup'
        throw new Error('Server is in setup mode')
      }
    } catch (setupCheckError) {
      // Ignore setup check errors
    }
    
    throw error
  }
}

export const api = {
  getOverview: () => fetchAPI('/stats/overview'),
  getModelUsage: () => fetchAPI('/stats/models'),
  getActivity: (days = 30) => fetchAPI(`/stats/activity?days=${days}`),
  getUsers: () => fetchAPI('/stats/users'),
  getTools: () => fetchAPI('/stats/tools')
}