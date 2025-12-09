const API_BASE = '/api/v1'

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // 携带 Cookie
  })

  // 处理 401 未授权
  if (response.status === 401) {
    // 可以在这里触发全局登出或跳转
    throw new ApiError('未登录或会话已过期', 401)
  }

  // 处理其他错误状态码
  if (!response.ok) {
    let errorMessage = `请求失败: ${response.status}`
    try {
      const errorData = await response.json()
      errorMessage = errorData.message || errorData.error || errorMessage
    } catch {
      // 忽略 JSON 解析错误
    }
    throw new ApiError(errorMessage, response.status)
  }

  // 204 No Content
  if (response.status === 204) {
    return undefined as T
  }

  return response.json()
}

export const api = {
  get: <T>(url: string) => request<T>(url, { method: 'GET' }),

  post: <T>(url: string, body?: unknown) =>
    request<T>(url, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(url: string, body?: unknown) =>
    request<T>(url, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(url: string) => request<T>(url, { method: 'DELETE' }),

  /**
   * 流式请求，用于 AI 代理
   */
  stream: async (
    url: string,
    body: unknown,
    onChunk: (chunk: string) => void
  ): Promise<void> => {
    const response = await fetch(`${API_BASE}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      credentials: 'include',
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      let errorMessage = `请求失败: ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorData.error || errorMessage
      } catch {
        // 忽略
      }
      throw new ApiError(errorMessage, response.status)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('无法读取响应流')
    }

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      // 处理 SSE 格式: data: xxx\n\n
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') {
            return
          }
          onChunk(data)
        }
      }
    }
  },
}

export { ApiError }
