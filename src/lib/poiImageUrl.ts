/** Lấy mảng từ body API kiểu .NET: trực tiếp hoặc { items|data|result|value|pois }. */
export function unwrapApiArray(data: unknown): unknown[] {
  if (Array.isArray(data)) return data
  if (!data || typeof data !== 'object') return []
  const o = data as Record<string, unknown>
  for (const key of ['items', 'data', 'result', 'results', 'value', 'pois', 'PoIs']) {
    const v = o[key]
    if (Array.isArray(v)) return v
  }
  return []
}

/**
 * Ảnh POI từ BE (vd: `public string? POIImgUrl { get; set; }`).
 * System.Text.Json camelCase đôi khi tạo key `pOIImgUrl`; JSON có thể giữ PascalCase `POIImgUrl`.
 * Đường dẫn tương đối (`/files/...`) cần gắn origin API — static thường không đi qua prefix `/api`.
 */

function coalesceString(...vals: unknown[]): string | undefined {
  for (const v of vals) {
    if (typeof v === 'string') {
      const t = v.trim()
      if (t) return t
    }
  }
  return undefined
}

/** Origin phục vụ file tĩnh (ảnh upload). Ưu tiên env, dev mặc định trùng vite proxy target. */
function apiStaticOrigin(): string {
  const fromEnv = import.meta.env.VITE_STATIC_ORIGIN || import.meta.env.VITE_API_ORIGIN
  let o =
    fromEnv && String(fromEnv).trim()
      ? String(fromEnv).replace(/\/$/, '')
      : import.meta.env.DEV
        ? 'http://localhost:5131'
        : typeof window !== 'undefined'
          ? window.location.origin
          : ''
  if (!o) return ''
  /* Dev: nhiều team set https://localhost:5131 nhưng Kestrel chỉ http → ảnh <img> fail chứng chỉ / từ chối kết nối */
  if (import.meta.env.DEV && /^https:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(o)) {
    o = o.replace(/^https:/i, 'http:')
  }
  return o
}

/**
 * Chuẩn hóa URL cho thẻ <img>: đường dẫn bắt đầu bằng `/` → gắn origin backend.
 */
export function resolvePoiImageUrl(src: string): string {
  const s = src.trim().replace(/\\/g, '/')
  if (!s) return s
  if (/^https?:\/\//i.test(s) || s.startsWith('data:')) return s
  if (s.startsWith('//')) {
    return typeof window !== 'undefined' ? `${window.location.protocol}${s}` : `https:${s}`
  }
  const origin = apiStaticOrigin()
  if (s.startsWith('/')) {
    if (origin) return `${origin}${s}`
    return s
  }
  /* BE đôi khi trả uploads/foo.jpg (không có / đầu) */
  if (origin && s.length > 0 && !s.includes('://')) {
    return `${origin}/${s.replace(/^\//, '')}`
  }
  return s
}

function mergeNestedPoi(raw: Record<string, unknown>): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...raw }
  for (const k of ['poi', 'Poi', 'poiDto', 'POI', 'PoiDto']) {
    const inner = raw[k]
    if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
      Object.assign(merged, inner as Record<string, unknown>)
    }
  }
  return merged
}

function pickPoiImgValue(raw: Record<string, unknown>): string | undefined {
  const direct = coalesceString(
    raw.POIImgUrl,
    raw.poiImgUrl,
    raw.pOIImgUrl,
    raw.PoiImgUrl,
    raw.poiIMGUrl,
    raw.imageUrl,
    raw.ImageUrl,
    raw.image,
    raw.thumbnailUrl,
  )
  if (direct) return direct

  for (const [key, val] of Object.entries(raw)) {
    const norm = key.replace(/[_\s-]/g, '').toLowerCase()
    if (norm === 'poiimgurl' && typeof val === 'string' && val.trim()) return val.trim()
  }
  return undefined
}

/** Lấy URL ảnh đã sẵn sàng cho `src` (gồm resolve đường dẫn tương đối). */
export function pickPoiImageUrl(raw: Record<string, unknown>): string | undefined {
  const merged = mergeNestedPoi(raw)
  const rawPath = pickPoiImgValue(merged)
  if (!rawPath) return undefined
  return resolvePoiImageUrl(rawPath)
}
