import { axiosClient } from '../config/axios'
import { pickPoiImageUrl } from './poiImageUrl'
import type { DayPlan, ItineraryStop, TripItinerary } from './tripPlannerTypes'

type PoiLite = {
  id: string
  name: string
  imageUrl?: string
  city?: string
  address?: string
}

function normCity(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
}

function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function toYMD(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseYMD(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function addDays(base: Date, n: number): Date {
  const x = new Date(base)
  x.setDate(x.getDate() + n)
  return x
}

function enumerateDates(startIso: string, endIso: string): string[] {
  const out: string[] = []
  let d = parseYMD(startIso)
  const end = parseYMD(endIso)
  while (d <= end) {
    out.push(toYMD(d))
    d = addDays(d, 1)
  }
  return out
}

/** Thứ tiếng Việt: CN, T2, … T7 */
export function viWeekdayLabel(d: Date): string {
  const j = d.getDay()
  const labels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
  return labels[j]
}

async function fetchRecommendedPois(): Promise<PoiLite[]> {
  try {
    const { data } = await axiosClient.get<unknown>('pois/recommended', { params: { limit: 40 } })
    const arr = Array.isArray(data)
      ? data
      : (data as { items?: unknown[]; data?: unknown[] })?.items ??
        (data as { data?: unknown[] })?.data ??
        []
    return arr.map((p, i) => {
      const x = p as Record<string, unknown>
      return {
        id: String(x.id ?? i),
        name: String(x.name ?? 'Địa điểm'),
        imageUrl: pickPoiImageUrl(x),
        city: x.city as string | undefined,
        address: x.address as string | undefined,
      }
    })
  } catch {
    return []
  }
}

const FALLBACK: Record<string, PoiLite[]> = {
  'ha noi': [
    {
      id: 'fb-hn-1',
      name: 'Nhà thờ Lớn Hà Nội',
      city: 'Hà Nội',
      address: 'Phố Nhà Chung, Hoàn Kiếm',
      imageUrl:
        'https://images.unsplash.com/photo-1599708153386-62bf3f09ba42?w=600&q=80',
    },
    {
      id: 'fb-hn-2',
      name: 'Văn Miếu — Quốc Tử Giám',
      city: 'Hà Nội',
      address: '58 Quốc Tử Giám',
      imageUrl:
        'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600&q=80',
    },
    {
      id: 'fb-hn-3',
      name: 'Hồ Hoàn Kiếm',
      city: 'Hà Nội',
      address: 'Hoàn Kiếm',
      imageUrl:
        'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=600&q=80',
    },
    {
      id: 'fb-hn-4',
      name: 'Phố cổ Hà Nội',
      city: 'Hà Nội',
      address: 'Hoàn Kiếm',
      imageUrl:
        'https://images.unsplash.com/photo-1528181304800-259b08848526?w=600&q=80',
    },
    {
      id: 'fb-hn-5',
      name: 'Bảo tàng Dân tộc học',
      city: 'Hà Nội',
      address: 'Nguyễn Văn Huyên',
      imageUrl:
        'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=600&q=80',
    },
  ],
  'hoi an': [
    {
      id: 'fb-ha-1',
      name: 'Phố cổ Hội An',
      city: 'Hội An',
      address: 'Sông Hoài',
      imageUrl:
        'https://images.unsplash.com/photo-1528127269322-539801943592?w=600&q=80',
    },
    {
      id: 'fb-ha-2',
      name: 'Chùa Cầu',
      city: 'Hội An',
      address: 'Trần Phú',
      imageUrl:
        'https://images.unsplash.com/photo-1559622210-8f603fc6b1c4?w=600&q=80',
    },
  ],
  'da nang': [
    {
      id: 'fb-dn-1',
      name: 'Cầu Rồng',
      city: 'Đà Nẵng',
      address: 'Sông Hàn',
      imageUrl:
        'https://images.unsplash.com/photo-1559592413-7cec096d7fc8?w=600&q=80',
    },
    {
      id: 'fb-dn-2',
      name: 'Bãi biển Mỹ Khê',
      city: 'Đà Nẵng',
      address: 'Mỹ Khê',
      imageUrl:
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
    },
  ],
  'tp ho chi minh': [
    {
      id: 'fb-sg-1',
      name: 'Dinh Độc Lập',
      city: 'TP.HCM',
      address: 'Quận 1',
      imageUrl:
        'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=600&q=80',
    },
    {
      id: 'fb-sg-2',
      name: 'Nhà thờ Đức Bà',
      city: 'TP.HCM',
      address: 'Quận 1',
      imageUrl:
        'https://images.unsplash.com/photo-1565967511844-4c7c5e0c0b0b?w=600&q=80',
    },
  ],
}

function fallbackPoisFor(city: string): PoiLite[] {
  const k = normCity(city)
  if (k.includes('ha noi') || k.includes('hanoi')) return FALLBACK['ha noi']
  if (k.includes('hoi an') || k.includes('hoian')) return FALLBACK['hoi an']
  if (k.includes('da nang') || k.includes('danang')) return FALLBACK['da nang']
  if (k.includes('ho chi minh') || k.includes('hcm') || k.includes('sai gon') || k.includes('tp hcm')) {
    return FALLBACK['tp ho chi minh']
  }
  return FALLBACK['ha noi'].map((p, i) => ({
    ...p,
    id: `fb-gen-${i}-${normCity(city).slice(0, 8)}`,
    city,
    name: p.name.replace(/Hà Nội/g, city),
  }))
}

function mergePois(api: PoiLite[], city: string): PoiLite[] {
  const nk = normCity(city)
  const local = api.filter((p) => {
    const c = p.city ? normCity(p.city) : ''
    return c && (nk.includes(c) || c.includes(nk) || nk.split(/\s+/).some((w) => w.length > 2 && c.includes(w)))
  })
  const fb = fallbackPoisFor(city)
  const seen = new Set<string>()
  const out: PoiLite[] = []
  for (const p of [...local, ...fb, ...api]) {
    const key = p.name.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ ...p, city: p.city ?? city })
    if (out.length >= 16) break
  }
  return out.slice(0, 16)
}

const SLOT_TEMPLATES = [
  { start: '08:00', end: '09:30' },
  { start: '10:00', end: '11:30' },
  { start: '14:00', end: '15:30' },
  { start: '16:00', end: '17:30' },
]

function pickTag(preferenceIds: string[], labels: Map<string, string>): string | undefined {
  if (!preferenceIds.length) return 'Gợi ý AI'
  const first = preferenceIds[0]
  return labels.get(first) ?? 'Sở thích của bạn'
}

function openingHoursFor(seed: number): string {
  const opts = [
    '8:00 – 11:00 và 14:00 – 20:00',
    '7:00 – 22:00',
    'Cả ngày',
    '9:00 – 18:00 (T2–CN)',
  ]
  return opts[seed % opts.length]
}

function costFor(seed: number): string {
  const opts = ['Miễn phí', 'Miễn phí', 'Từ 50.000 đ', 'Từ 100.000 đ']
  return opts[seed % opts.length]
}

function buildDay(
  dateIso: string,
  dayIndex: number,
  pool: PoiLite[],
  city: string,
  preferenceIds: string[],
  prefLabels: Map<string, string>,
): DayPlan {
  const n = pool.length
  const perDay = Math.min(4, Math.max(3, n >= 4 ? 4 : n))
  const stops: ItineraryStop[] = []
  const tag = pickTag(preferenceIds, prefLabels)

  for (let i = 0; i < perDay; i++) {
    const poi = pool[(dayIndex * perDay + i) % Math.max(n, 1)] ?? pool[0]
    const slot = SLOT_TEMPLATES[i % SLOT_TEMPLATES.length]
    const seed = hashStr(`${dateIso}-${i}-${poi?.id ?? i}`)
    const temp = 22 + (seed % 9)
    const id = `stop-${dateIso}-${i}`

    stops.push({
      id,
      order: i + 1,
      startTime: slot.start,
      endTime: slot.end,
      title: poi?.name ?? `Điểm tham quan ${i + 1}`,
      city: poi?.city ?? city,
      address: poi?.address,
      imageUrl:
        poi?.imageUrl ??
        `https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&q=80&sig=${seed % 1000}`,
      rating: Math.round((4.2 + (seed % 7) / 10) * 10) / 10,
      openingHours: openingHoursFor(seed),
      costLabel: costFor(seed),
      weatherTempC: temp,
      tag,
      kind: 'poi',
    })
  }

  return { date: dateIso, stops }
}

export async function generateTripItinerary(params: {
  tripId: string
  city: string
  startDate: string
  endDate: string
  preferenceIds: string[]
  preferenceLabelById: Map<string, string>
}): Promise<TripItinerary> {
  const { tripId, city, startDate, endDate, preferenceIds, preferenceLabelById } = params
  const apiPois = await fetchRecommendedPois()
  const pool = mergePois(apiPois, city)
  const dates = enumerateDates(startDate, endDate)
  const days: DayPlan[] = dates.map((d, idx) =>
    buildDay(d, idx, pool, city, preferenceIds, preferenceLabelById),
  )

  return {
    tripId,
    city,
    days,
    generatedAt: new Date().toISOString(),
  }
}
