export const setAuthHeader = (token?: string) => {
  if (!token) {
    return {}
  }
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
}

type APIArgs = {
  httpArgs?: {
    headers?: Record<string, string>
  }
  token?: string
}

async function get(url: string, getArgs: APIArgs = {}) {
  const response = await fetch(url, {
    method: "GET",
    ...getArgs,
    headers: {
      "Content-Type": "application/json",
      ...(getArgs.httpArgs?.headers ?? {}),
      ...(setAuthHeader(getArgs.token).headers ?? {}),
    },
  })
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  return await response.json()
}

async function post(url: string, payload: any, postArgs: APIArgs = {}) {
  const response = await fetch(url, {
    method: "POST",
    ...postArgs,
    headers: {
      "Content-Type": "application/json",
      ...(postArgs.httpArgs?.headers ?? {}),
      ...(setAuthHeader(postArgs.token).headers ?? {}),
    },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  return await response.json()
}

export const api = { get, post }
