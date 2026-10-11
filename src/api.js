const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

export function getToken() {
  return localStorage.getItem('bookhub_token')
}

export async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`${API_URL}${path}`, { ...options, headers })
  if (response.status === 204) return null
  const text = await response.text()
  let data = null
  try { data = text ? JSON.parse(text) : null } catch { data = text }
  if (!response.ok) {
    const message = data?.detail || data?.message || data?.error || data?.title || 'Request failed'
    throw new Error(message)
  }
  return data
}
