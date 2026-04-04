/** Lịch trình AI (lưu kèm trip trong localStorage) */

export type StopKind = 'poi' | 'transit' | 'meal' | 'hotel'

export type ItineraryStop = {
  id: string
  order: number
  startTime: string
  endTime: string
  title: string
  city: string
  address?: string
  imageUrl: string
  rating: number
  openingHours: string
  costLabel: string
  weatherTempC: number
  /** Nhãn hiển thị (vd: sở thích đã chọn) */
  tag?: string
  kind: StopKind
}

export type DayPlan = {
  date: string
  stops: ItineraryStop[]
}

export type TripItinerary = {
  tripId: string
  city: string
  days: DayPlan[]
  generatedAt: string
}
