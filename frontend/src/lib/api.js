export class ApiError extends Error {
  constructor(message, statusCode = 0) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
  }
}

let refreshRequest = null

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

function notifyUnauthorized() {
  window.dispatchEvent(new Event('janeq:unauthorized'))
}

async function fetchResponse(url, init, { signal, timeoutMs, responseType }) {
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
    const response = await fetch(url, { ...init, signal: controller.signal })
    let payload = null

    if (response.status !== 204) {
      if (responseType === 'blob' && response.ok) {
        payload = await response.blob()
      } else {
        try {
          payload = await response.json()
        } catch (error) {
          if (didTimeout || signal?.aborted) throw error
          if (response.ok) {
            throw new ApiError('The server returned an invalid response.', response.status)
          }
        }
      }
    }

    return { response, payload }
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

function throwForResponse({ response, payload }) {
  if (!response.ok) {
    const fallback = `The request failed (${response.status}). Please try again.`
    throw new ApiError(getErrorMessage(payload, fallback), response.status)
  }
  return payload
}

function refreshAuthSession(timeoutMs) {
  if (!refreshRequest) {
    // Share one refresh operation when multiple requests encounter an expired access token.
    refreshRequest = fetchResponse(
      '/api/auth/refresh',
      { method: 'POST', credentials: 'include' },
      { timeoutMs, responseType: 'json' },
    )
      .then(throwForResponse)
      .finally(() => {
        refreshRequest = null
      })
  }
  return refreshRequest
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
  const url = path.startsWith('/api/') ? path : `/api${path}`
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

  const init = {
    method,
    headers,
    body: requestBody,
    credentials: 'include',
  }
  let result = await fetchResponse(url, init, { signal, timeoutMs, responseType })

  if (result.response.status === 401 && authRequired && url !== '/api/auth/refresh') {
    try {
      await refreshAuthSession(timeoutMs)
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 401) {
        notifyUnauthorized()
      }
      throw error
    }

    if (signal?.aborted) {
      throw new DOMException('The operation was aborted.', 'AbortError')
    }
    result = await fetchResponse(url, init, { signal, timeoutMs, responseType })
  }

  if (result.response.status === 401 && authRequired) {
    notifyUnauthorized()
  }

  return throwForResponse(result)
}
