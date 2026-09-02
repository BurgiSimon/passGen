// Shared by usePasswordGen and useTheme.

export const setCookie = (name, value, days = 365) => {
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`
}

export const getCookie = (name) => {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

// Cookies are user-editable, so every read is validated by its caller.
export const getBool = (name, fallback) => {
  const raw = getCookie(name)
  return raw === null ? fallback : raw === 'true'
}

export const getEnum = (name, allowed, fallback) => {
  const raw = getCookie(name)
  return allowed.includes(raw) ? raw : fallback
}
