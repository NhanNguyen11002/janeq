export class ApiError extends Error {
  constructor(message, statusCode = 0) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
  }
}

function getErrorMessage(payload, fallback) {
  if (typeof payload?.detail === 'string') {
    return payload.detail
  }
  if (Array.isArray(payload?.detail)) {
    return payload.detail
      .map((item) => item.msg)
      .filter(Boolean)
      .join(', ')
  }
  if (typeof payload?.message === 'string') {
    return payload.message
  }
  return fallback
}

export async function apiRequest(
  path,
  {
    method = 'GET',
    body,
    token,
    authRequired = false,
    signal,
    responseType = 'json',
    headers: initialHeaders,
  } = {},
) {
  const headers = new Headers(initialHeaders)
  let requestBody

  if (body !== undefined) {
    if (body instanceof FormData) {
      requestBody = body
    } else {
      headers.set('Content-Type', 'application/json')
      requestBody = JSON.stringify(body)
    }
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  let response
  try {
    response = await fetch(path.startsWith('/api/') ? path : `/api${path}`, {
      method,
      headers,
      body: requestBody,
      signal,
    })
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error
    }
    throw new ApiError('Unable to connect to the server. Check your connection and try again.')
  }

  if (response.status === 401 && authRequired) {
    window.dispatchEvent(new Event('janeq:unauthorized'))
  }

  if (!response.ok) {
    let payload
    try {
      payload = await response.json()
    } catch {
      payload = null
    }
    const fallback = `The request failed (${response.status}). Please try again.`
    throw new ApiError(getErrorMessage(payload, fallback), response.status)
  }

  if (response.status === 204) {
    return null
  }

  if (responseType === 'blob') {
    return response.blob()
  }

  try {
    return await response.json()
  } catch {
    throw new ApiError('The server returned an invalid response.', response.status)
  }
}
