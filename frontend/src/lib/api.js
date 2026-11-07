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
    authRequired = false,
    signal,
    timeoutMs = 15000,
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

  const controller = new AbortController()
  let didTimeout = false
  const abortFromCaller = () => controller.abort()
  if (signal?.aborted) {
    controller.abort()
  } else {
    signal?.addEventListener('abort', abortFromCaller, { once: true })
  }
  const timeoutId = setTimeout(() => {
    didTimeout = true
    controller.abort()
  }, timeoutMs)

  try {
    const response = await fetch(path.startsWith('/api/') ? path : `/api${path}`, {
      method,
      headers,
      body: requestBody,
      signal: controller.signal,
      credentials: 'include',
    })

    if (response.status === 401 && authRequired) {
      window.dispatchEvent(new Event('janeq:unauthorized'))
    }

    if (!response.ok) {
      let payload
      try {
        payload = await response.json()
      } catch (error) {
        if (didTimeout || signal?.aborted) throw error
        payload = null
      }
      const fallback = `The request failed (${response.status}). Please try again.`
      throw new ApiError(getErrorMessage(payload, fallback), response.status)
    }

    if (response.status === 204) {
      return null
    }

    if (responseType === 'blob') {
      return await response.blob()
    }

    try {
      return await response.json()
    } catch (error) {
      if (didTimeout || signal?.aborted) throw error
      throw new ApiError('The server returned an invalid response.', response.status)
    }
  } catch (error) {
    if (didTimeout) {
      throw new ApiError('The request timed out. Please try again.')
    }
    if (signal?.aborted || error.name === 'AbortError') {
      throw error
    }
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError('Unable to connect to the server. Check your connection and try again.')
  } finally {
    clearTimeout(timeoutId)
    signal?.removeEventListener('abort', abortFromCaller)
  }
}
