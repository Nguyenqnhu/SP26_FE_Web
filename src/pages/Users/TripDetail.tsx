import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Link as LinkIcon,
  Mail,
  MapPin,
  Share2,
  Sparkles,
  Sun,
  Wallet,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { AppFooter, AppNavbar } from '../../components/layout'
import { viWeekdayLabel } from '../../lib/generateTripItinerary'
import { loadTrips, type TripItem } from '../../lib/tripStorage'
import './trip-detail.css'

function parseYMD(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function formatRangeVi(start: string, end: string): string {
  const a = parseYMD(start)
  const b = parseYMD(end)
  const opt: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'numeric', year: 'numeric' }
  return `${a.toLocaleDateString('vi-VN', opt)} – ${b.toLocaleDateString('vi-VN', opt)}`
}

function monthTitle(isoDate: string): string {
  const d = parseYMD(isoDate)
  return `THÁNG ${d.getMonth() + 1} ${d.getFullYear()}`
}

function enumerateDates(startIso: string, endIso: string): string[] {
  const out: string[] = []
  let d = parseYMD(startIso)
  const end = parseYMD(endIso)
  while (d <= end) {
    out.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
    )
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
  }
  return out
}

type MapPoint = {
  id: string
  title: string
  city: string
  address?: string
  startTime: string
  endTime: string
  openingHours: string
  ticketPrice: string
  weatherTempC: number
  lat: number
  lng: number
}

function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  'Hà Nội': { lat: 21.0278, lng: 105.8342 },
  'TP. Hồ Chí Minh': { lat: 10.8231, lng: 106.6297 },
  'TP.HCM': { lat: 10.8231, lng: 106.6297 },
  'Hồ Chí Minh': { lat: 10.8231, lng: 106.6297 },
  'Đà Nẵng': { lat: 16.0544, lng: 108.2022 },
  'Hội An': { lat: 15.8801, lng: 108.338 },
  Huế: { lat: 16.4637, lng: 107.5909 },
  'Đà Lạt': { lat: 11.9404, lng: 108.4583 },
  'Nha Trang': { lat: 12.2388, lng: 109.1967 },
}

function baseCoord(city: string) {
  return CITY_COORDS[city] ?? { lat: 15.5, lng: 108.5 }
}

function jitterCoord(city: string, seed: number, idx: number) {
  const base = baseCoord(city)
  const j1 = ((seed % 97) - 48) / 1000
  const j2 = (((seed >> 3) % 97) - 48) / 1000
  const step = idx * 0.002
  return { lat: base.lat + j1 + step, lng: base.lng + j2 - step * 0.6 }
}

function openingHoursFor(seed: number): string {
  const opts = ['8:00 – 11:00 và 14:00 – 20:00', '7:00 – 22:00', 'Cả ngày', '9:00 – 18:00 (T2–CN)']
  return opts[seed % opts.length]
}

function ticketFor(seed: number): string {
  const opts = ['Miễn phí', 'Miễn phí', 'Từ 50.000 đ', 'Từ 100.000 đ', 'Từ 30.000 đ']
  return opts[seed % opts.length]
}

function timeSlots(seed: number): Array<{ start: string; end: string }> {
  const base = seed % 2 === 0 ? ['08:00', '10:00', '14:00'] : ['08:30', '11:00', '15:00']
  return [
    { start: base[0], end: '09:30' },
    { start: base[1], end: '12:00' },
    { start: base[2], end: '16:30' },
  ]
}

function mockPoisForSegment(tripId: string, dayIso: string, segmentCity: string): MapPoint[] {
  const seed = hashStr(`${tripId}-${dayIso}-${segmentCity}`)
  const slots = timeSlots(seed)
  const names = [
    'Nhà thờ lớn',
    'Chợ địa phương',
    'Bảo tàng',
    'Cà phê view đẹp',
    'Phố đi bộ',
    'Công viên ven sông',
  ]
  const points: MapPoint[] = []
  for (let i = 0; i < 3; i++) {
    const s = hashStr(`${seed}-${i}`)
    const title = `${names[(s + i) % names.length]} ${segmentCity}`
    const weatherTempC = 23 + ((s + seed) % 9)
    const { lat, lng } = jitterCoord(segmentCity, s, i)
    points.push({
      id: `p-${segmentCity}-${dayIso}-${i}`,
      title,
      city: segmentCity,
      address: `Khu vực trung tâm · ${segmentCity}`,
      startTime: slots[i]?.start ?? '08:00',
      endTime: slots[i]?.end ?? '09:00',
      openingHours: openingHoursFor(s),
      ticketPrice: ticketFor(s),
      weatherTempC,
      lat,
      lng,
    })
  }
  return points
}

const TripDetail = () => {
  const { tripId } = useParams<{ tripId: string }>()
  const navigate = useNavigate()
  const [trip, setTrip] = useState<TripItem | null>(() => {
    if (!tripId) return null
    return loadTrips().find((x) => x.id === tripId) ?? null
  })
  const [selectedDay, setSelectedDay] = useState<string | null>(() => {
    if (!tripId) return null
    const t = loadTrips().find((x) => x.id === tripId)
    return t?.startDate ?? null
  })
  const dayBtnRefs = useRef<Map<string, HTMLButtonElement | null>>(new Map())
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) navigate('/login', { replace: true })
  }, [navigate])

  useEffect(() => {
    if (!tripId) {
      navigate('/trips', { replace: true })
      return
    }
    const t = loadTrips().find((x) => x.id === tripId)
    if (!t) {
      toast.error('Không tìm thấy chuyến đi.')
      navigate('/trips', { replace: true })
      return
    }
    setTrip(t)
    setSelectedDay(t.startDate)
  }, [tripId, navigate])

  useEffect(() => {
    if (!selectedDay) return
    const el = dayBtnRefs.current.get(selectedDay)
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [selectedDay])

  const daysInTrip = useMemo(() => {
    if (!trip) return []
    return enumerateDates(trip.startDate, trip.endDate)
  }, [trip])

  const dayIndex = useMemo(() => {
    if (!selectedDay) return 0
    return Math.max(0, daysInTrip.indexOf(selectedDay))
  }, [daysInTrip, selectedDay])

  const goPrevDay = () => {
    if (dayIndex <= 0) return
    setSelectedDay(daysInTrip[dayIndex - 1])
  }

  const goNextDay = () => {
    if (dayIndex >= daysInTrip.length - 1) return
    setSelectedDay(daysInTrip[dayIndex + 1])
  }

  const handleBack = () => navigate('/trips')

  if (!tripId) return null

  if (!trip) {
    return (
      <div className="td-page et-page">
        <AppNavbar />
        <main className="td-main">
          <button type="button" className="td-back" onClick={handleBack}>
            <ArrowLeft size={18} aria-hidden />
            Quay lại danh sách
          </button>
          <p className="td-error" style={{ textAlign: 'left', marginTop: 16 }}>
            Không tìm thấy chuyến đi hoặc dữ liệu đã thay đổi.
          </p>
        </main>
        <AppFooter />
      </div>
    )
  }

  const start = trip.startPoint || trip.city
  const end = trip.endPoint || trip.city
  const vias = (trip.viaStops ?? []).filter(Boolean)
  const routeStops = [start, ...vias, end].filter(Boolean)
  const routeLabel =
    trip.tripType === 'round_trip' ? `${routeStops.join(' → ')} → ${start}` : routeStops.join(' → ')

  const shareLink = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    return `${origin}/trips/${tripId}`
  }, [tripId])

  const segments = useMemo(() => {
    // segments hiển thị POIs theo từng chặng: Start → via1 → ... → End (+ về lại nếu khứ hồi)
    const base = routeStops
    const items = trip.tripType === 'round_trip' ? [...base, start] : base
    return items
  }, [routeStops, start, trip.tripType])

  const selected = selectedDay ?? trip.startDate

  const poiBySegment = useMemo(() => {
    const map = new Map<string, MapPoint[]>()
    for (const seg of segments) {
      map.set(seg, mockPoisForSegment(tripId, selected, seg))
    }
    return map
  }, [segments, tripId, selected])

  const allPoints = useMemo(() => segments.flatMap((s) => poiBySegment.get(s) ?? []), [segments, poiBySegment])

  return (
    <div className="td-page et-page">
      <AppNavbar />
      <main className="td-main">
        <button type="button" className="td-back" onClick={handleBack}>
          <ArrowLeft size={18} aria-hidden />
          Quay lại danh sách
        </button>

        <section className="td-hero" aria-label="Tóm tắt chuyến">
          <div className="td-hero__accent" aria-hidden />
          <div className="td-hero__inner">
            <span className="td-hero__badge">
              <Sparkles size={14} aria-hidden />
              Lịch AI
            </span>
            <div className="td-hero__toprow">
              <h2 className="td-hero__title">Hành trình tại {trip.city}</h2>
              <button type="button" className="td-invite" onClick={() => setInviteOpen(true)}>
                <Share2 size={16} aria-hidden />
                Invite
              </button>
            </div>
            <p className="td-hero__range">
              <CalendarDays size={16} aria-hidden />
              {formatRangeVi(trip.startDate, trip.endDate)}
            </p>
            <p className="td-hero__range" style={{ marginTop: -6 }}>
              <MapPin size={16} aria-hidden />
              {routeLabel || '—'}
            </p>
            <div className="td-hero__stats">
              <div className="td-hero__stat">
                <strong>{daysInTrip.length}</strong>
                <span>ngày</span>
              </div>
              <div className="td-hero__stat-divider" aria-hidden />
              <div className="td-hero__stat">
                <strong>{allPoints.length}</strong>
                <span>địa điểm gợi ý</span>
              </div>
            </div>
          </div>
        </section>

        {selectedDay ? (
          <div className="td-cal-shell">
            <div className="td-cal-shell__head">
              <span className="td-cal-shell__month">{monthTitle(selectedDay)}</span>
              <span className="td-cal-shell__hint">Vuốt hoặc dùng mũi tên để đổi ngày</span>
            </div>
            <div className="td-cal-shell__controls">
              <button
                type="button"
                className="td-cal-nav"
                aria-label="Ngày trước"
                disabled={dayIndex <= 0}
                onClick={goPrevDay}
              >
                <ChevronLeft size={22} />
              </button>
              <div className="td-cal-viewport">
                <div
                  className="td-cal-strip"
                  role="tablist"
                  aria-label="Chọn ngày trong chuyến"
                >
                  {daysInTrip.map((iso) => {
                    const d = parseYMD(iso)
                    const inRange = iso >= trip.startDate && iso <= trip.endDate
                    const sel = iso === selectedDay
                    return (
                      <button
                        key={iso}
                        ref={(el) => {
                          dayBtnRefs.current.set(iso, el)
                        }}
                        type="button"
                        role="tab"
                        aria-selected={sel}
                        className={`td-cal-day${inRange ? ' in-range' : ''}${sel ? ' is-selected' : ''}`}
                        onClick={() => setSelectedDay(iso)}
                      >
                        <span className="td-cal-day__dow">{viWeekdayLabel(d)}</span>
                        <span className="td-cal-day__num">{d.getDate()}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
              <button
                type="button"
                className="td-cal-nav"
                aria-label="Ngày sau"
                disabled={dayIndex >= daysInTrip.length - 1}
                onClick={goNextDay}
              >
                <ChevronRight size={22} />
              </button>
            </div>
          </div>
        ) : null}

        <div className="td-layout">
          <section className="td-left">
            <h3 className="td-day-heading">Lịch trình chi tiết theo segment</h3>

            {segments.map((seg, segIdx) => {
              const points = poiBySegment.get(seg) ?? []
              return (
                <div className="td-seg" key={`${seg}-${segIdx}`}>
                  <div className="td-seg__head">
                    <div className="td-seg__title">
                      <span className="td-seg__pill">Segment {segIdx + 1}</span>
                      <span className="td-seg__name">{seg}</span>
                    </div>
                    <span className="td-seg__meta">
                      <Sun size={16} aria-hidden /> {points[0]?.weatherTempC ?? 27}°
                    </span>
                  </div>

                  <div className="td-stops td-stops--plain">
                    {points.map((p, idx) => {
                      const isLast = idx === points.length - 1
                      return (
                        <div key={p.id} className="td-stop-row">
                          <div className="td-stop-time">
                            <span className="td-stop-time__start">{p.startTime}</span>
                            <span className="td-stop-time__sep">–</span>
                            <span className="td-stop-time__end">{p.endTime}</span>
                          </div>
                          <div className="td-stop-rail" aria-hidden>
                            <span className="td-stop-dot" />
                            {!isLast ? <span className="td-stop-line" /> : null}
                          </div>
                          <article className="td-card td-card--flat">
                            <div className="td-card-head">
                              <span>
                                {p.startTime} – {p.endTime}
                              </span>
                              <span className="td-weather">
                                <Sun size={17} aria-hidden />
                                {p.weatherTempC}°
                              </span>
                            </div>
                            <div className="td-card-body">
                              <div>
                                <h3>{p.title}</h3>
                                <div className="td-meta-line">
                                  <MapPin size={14} aria-hidden />
                                  <span>
                                    {p.city}
                                    {p.address ? ` · ${p.address}` : ''}
                                  </span>
                                </div>
                                <div className="td-meta-line">
                                  <Clock size={14} aria-hidden />
                                  <span>{p.openingHours}</span>
                                </div>
                                <div className="td-meta-line">
                                  <Wallet size={14} aria-hidden />
                                  <span>{p.ticketPrice}</span>
                                </div>
                                {idx < points.length - 1 ? (
                                  <p className="td-next">→ Điểm tiếp theo: {points[idx + 1]?.title ?? '—'}</p>
                                ) : null}
                              </div>
                              <div className="td-card-img">
                                <img
                                  src={
                                    trip.imageUrl ??
                                    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&q=80'
                                  }
                                  alt=""
                                  loading="lazy"
                                />
                              </div>
                            </div>
                          </article>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </section>

          <aside className="td-right" aria-label="Bản đồ">
            <div className="td-map">
              <div className="td-map__head">
                <span className="td-map__title">
                  <MapPin size={16} aria-hidden /> Maps
                </span>
                <span className="td-map__sub">{allPoints.length} địa điểm</span>
              </div>

              <div className="td-map__canvas" role="img" aria-label="Bản đồ mock hiển thị các địa điểm">
                {(() => {
                  const lats = allPoints.map((p) => p.lat)
                  const lngs = allPoints.map((p) => p.lng)
                  const minLat = Math.min(...lats)
                  const maxLat = Math.max(...lats)
                  const minLng = Math.min(...lngs)
                  const maxLng = Math.max(...lngs)
                  const pad = 0.01
                  const latSpan = Math.max(0.02, maxLat - minLat + pad)
                  const lngSpan = Math.max(0.02, maxLng - minLng + pad)

                  return allPoints.map((p, idx) => {
                    const x = ((p.lng - minLng) / lngSpan) * 100
                    const y = (1 - (p.lat - minLat) / latSpan) * 100
                    return (
                      <button
                        key={p.id}
                        type="button"
                        className="td-pin"
                        style={{ left: `${x}%`, top: `${y}%` }}
                        title={`${p.title} (${p.city})`}
                        onClick={() => toast.message(p.title, { description: p.city })}
                      >
                        <span className="td-pin__dot" aria-hidden />
                        <span className="td-pin__label">{idx + 1}</span>
                      </button>
                    )
                  })
                })()}
              </div>

              <div className="td-map__list" aria-label="Danh sách địa điểm trên bản đồ">
                {allPoints.slice(0, 10).map((p) => (
                  <div key={`li-${p.id}`} className="td-map__item">
                    <span className="td-map__item-title">{p.title}</span>
                    <span className="td-map__item-sub">{p.city}</span>
                  </div>
                ))}
                {allPoints.length > 10 ? (
                  <div className="td-map__more">+{allPoints.length - 10} địa điểm khác…</div>
                ) : null}
              </div>
            </div>
          </aside>
        </div>
      </main>
      <AppFooter />

      {inviteOpen ? (
        <div
          className="td-invite-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="td-invite-title"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setInviteOpen(false)
          }}
        >
          <div className="td-invite-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="td-invite-head">
              <h3 id="td-invite-title">Mời bạn bè</h3>
              <button type="button" className="td-invite-close" onClick={() => setInviteOpen(false)} aria-label="Đóng">
                <X size={18} />
              </button>
            </div>

            <div className="td-invite-block">
              <div className="td-invite-label">
                <LinkIcon size={16} aria-hidden /> Link mời
              </div>
              <div className="td-invite-row">
                <input value={shareLink} readOnly aria-label="Link mời" />
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(shareLink)
                      toast.success('Đã copy link.')
                    } catch {
                      toast.message('Copy link', { description: shareLink })
                    }
                  }}
                >
                  Copy
                </button>
              </div>
            </div>

            <div className="td-invite-block">
              <div className="td-invite-label">
                <Mail size={16} aria-hidden /> Gửi qua Gmail
              </div>
              <div className="td-invite-row">
                <input
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="email@example.com"
                  aria-label="Email"
                />
                <button
                  type="button"
                  onClick={() => {
                    const to = inviteEmail.trim()
                    const subj = encodeURIComponent('Mời bạn tham gia chuyến đi')
                    const body = encodeURIComponent(`Mình mời bạn xem trip tại đây: ${shareLink}`)
                    window.location.href = `mailto:${to}?subject=${subj}&body=${body}`
                  }}
                  disabled={!inviteEmail.trim()}
                >
                  Gửi
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default TripDetail
