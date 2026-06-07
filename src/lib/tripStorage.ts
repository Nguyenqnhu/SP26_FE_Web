import type { TripItinerary } from './tripPlannerTypes'

export const TRIP_STORAGE_KEY = 'travelgo-trips-v1'

export type TripType = 'one_way' | 'round_trip'

export type TripItem = {
  id: string
  /** Dùng cho legacy UI (seed cũ). Với flow mới dùng startPoint/endPoint. */
  city: string
  startPoint?: string
  endPoint?: string
  tripType?: TripType
  /** Danh sách điểm dừng trung gian theo thứ tự (không gồm start/end). */
  viaStops?: string[]
  startDate: string
  endDate: string
  budget: number
  imageUrl?: string
  /** Legacy: giữ để không vỡ dữ liệu cũ */
  preferenceIds?: string[]
  itinerary?: TripItinerary | null
}

function toYMD(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function addDays(base: Date, days: number): Date {
  const x = new Date(base)
  x.setDate(x.getDate() + days)
  return x
}

function buildDefaultTrips(): TripItem[] {
  const t = new Date()
  return [
    {
      id: 'seed-1',
      city: 'Hội An',
      startPoint: 'Hà Nội',
      endPoint: 'Hội An',
      tripType: 'one_way',
      viaStops: [],
      startDate: toYMD(addDays(t, -45)),
      endDate: toYMD(addDays(t, -38)),
      budget: 10_000_000,
      imageUrl:
        'https://images.unsplash.com/photo-1528127269322-539801943592?w=800&q=80',
      preferenceIds: [],
    },
    {
      id: 'seed-2',
      city: 'Hà Nội',
      startPoint: 'Hà Nội',
      endPoint: 'TP. Hồ Chí Minh',
      tripType: 'round_trip',
      viaStops: ['Đà Nẵng', 'Hội An'],
      startDate: toYMD(addDays(t, -3)),
      endDate: toYMD(addDays(t, 4)),
      budget: 12_000_000,
      imageUrl:
        'https://images.unsplash.com/photo-1599708153386-62bf3f09ba42?w=800&q=80',
      preferenceIds: [],
    },
    {
      id: 'seed-3',
      city: 'Đà Nẵng',
      startPoint: 'Hà Nội',
      endPoint: 'Đà Nẵng',
      tripType: 'one_way',
      viaStops: [],
      startDate: toYMD(addDays(t, 14)),
      endDate: toYMD(addDays(t, 21)),
      budget: 8_500_000,
      imageUrl:
        'https://images.unsplash.com/photo-1559592413-7cec096d7fc8?w=800&q=80',
      preferenceIds: [],
    },
    {
      id: 'seed-4',
      city: 'TP. Hồ Chí Minh',
      startPoint: 'TP. Hồ Chí Minh',
      endPoint: 'Hà Nội',
      tripType: 'one_way',
      viaStops: [],
      startDate: toYMD(addDays(t, -120)),
      endDate: toYMD(addDays(t, -113)),
      budget: 9_200_000,
      imageUrl:
        'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&q=80',
      preferenceIds: [],
    },
  ]
}

function migrateTrip(t: TripItem): TripItem {
  const startPoint = t.startPoint ?? t.city ?? ''
  const endPoint = t.endPoint ?? t.city ?? ''
  return {
    ...t,
    startPoint,
    endPoint,
    tripType: t.tripType ?? 'one_way',
    viaStops: Array.isArray(t.viaStops) ? t.viaStops : [],
  }
}

export function loadTrips(): TripItem[] {
  try {
    const raw = localStorage.getItem(TRIP_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as unknown
      if (Array.isArray(parsed) && parsed.length) {
        const migrated = (parsed as TripItem[]).map(migrateTrip)
        // Lưu lại để đảm bảo shape mới đồng nhất
        localStorage.setItem(TRIP_STORAGE_KEY, JSON.stringify(migrated))
        return migrated
      }
    }
  } catch {
    /* fallback */
  }
  const initial = buildDefaultTrips()
  localStorage.setItem(TRIP_STORAGE_KEY, JSON.stringify(initial))
  return initial
}

export function saveTrips(list: TripItem[]) {
  localStorage.setItem(TRIP_STORAGE_KEY, JSON.stringify(list))
}

export function updateTripItinerary(tripId: string, itinerary: TripItinerary): TripItem[] {
  const list = loadTrips()
  const next = list.map((t) => (t.id === tripId ? { ...t, itinerary } : t))
  saveTrips(next)
  return next
}

export function updateTripViaStops(tripId: string, viaStops: string[]): TripItem[] {
  const list = loadTrips()
  const next = list.map((t) => (t.id === tripId ? { ...t, viaStops } : t))
  saveTrips(next)
  return next
}
