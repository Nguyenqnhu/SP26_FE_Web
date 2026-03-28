import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar,
  Home,
  Luggage,
  MapPin,
  Plus,
  Search,
  Sun,
  Wallet,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { AppFooter, AppNavbar } from '../../components/layout'
import './explore-trips.css'
import './trip-page.css'

const STORAGE_KEY = 'travelgo-trips-v1'

type TripStatus = 'upcoming' | 'ongoing' | 'completed'

type ActivityPref = 'outdoor' | 'indoor' | 'both'

type TripItem = {
  id: string
  city: string
  startDate: string
  endDate: string
  budget: number
  imageUrl?: string
  activityPref?: ActivityPref | null
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

function parseYMD(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function getTripStatus(startDate: string, endDate: string): TripStatus {
  const today = toYMD(new Date())
  if (endDate < today) return 'completed'
  if (startDate > today) return 'upcoming'
  return 'ongoing'
}

function statusLabel(s: TripStatus): string {
  if (s === 'completed') return 'Đã hoàn thành'
  if (s === 'ongoing') return 'Đang diễn ra'
  return 'Sắp tới'
}

function buildDefaultTrips(): TripItem[] {
  const t = new Date()
  return [
    {
      id: 'seed-1',
      city: 'Hội An',
      startDate: toYMD(addDays(t, -45)),
      endDate: toYMD(addDays(t, -38)),
      budget: 10_000_000,
      imageUrl:
        'https://images.unsplash.com/photo-1528127269322-539801943592?w=800&q=80',
      activityPref: 'outdoor',
    },
    {
      id: 'seed-2',
      city: 'Hà Nội',
      startDate: toYMD(addDays(t, -3)),
      endDate: toYMD(addDays(t, 4)),
      budget: 12_000_000,
      imageUrl:
        'https://images.unsplash.com/photo-1599708153386-62bf3f09ba42?w=800&q=80',
      activityPref: 'both',
    },
    {
      id: 'seed-3',
      city: 'Đà Nẵng',
      startDate: toYMD(addDays(t, 14)),
      endDate: toYMD(addDays(t, 21)),
      budget: 8_500_000,
      imageUrl:
        'https://images.unsplash.com/photo-1559592413-7cec096d7fc8?w=800&q=80',
      activityPref: 'indoor',
    },
    {
      id: 'seed-4',
      city: 'TP. Hồ Chí Minh',
      startDate: toYMD(addDays(t, -120)),
      endDate: toYMD(addDays(t, -113)),
      budget: 9_200_000,
      imageUrl:
        'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&q=80',
      activityPref: 'outdoor',
    },
  ]
}

function loadTrips(): TripItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as unknown
      if (Array.isArray(parsed) && parsed.length) {
        return parsed as TripItem[]
      }
    }
  } catch {
    /* fallback */
  }
  const initial = buildDefaultTrips()
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initial))
  return initial
}

function saveTrips(list: TripItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

function formatVnd(n: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(n)} đ`
}

function formatRangeVi(start: string, end: string): string {
  const a = parseYMD(start)
  const b = parseYMD(end)
  const opt: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'numeric', year: 'numeric' }
  return `${a.toLocaleDateString('vi-VN', opt)} - ${b.toLocaleDateString('vi-VN', opt)}`
}

type FilterTab = 'all' | 'active' | 'completed'

const Trips = () => {
  const navigate = useNavigate()
  const [trips, setTrips] = useState<TripItem[]>(() => [])
  const [hydrated, setHydrated] = useState(false)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<FilterTab>('all')
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) navigate('/login', { replace: true })
  }, [navigate])

  useEffect(() => {
    setTrips(loadTrips())
    setHydrated(true)
  }, [])

  const persist = useCallback((next: TripItem[]) => {
    setTrips(next)
    saveTrips(next)
  }, [])

  const withStatus = useMemo(
    () =>
      trips.map((trip) => ({
        ...trip,
        status: getTripStatus(trip.startDate, trip.endDate),
      })),
    [trips],
  )

  const counts = useMemo(() => {
    let active = 0
    let completed = 0
    for (const t of withStatus) {
      if (t.status === 'completed') completed += 1
      else active += 1
    }
    return { all: withStatus.length, active, completed }
  }, [withStatus])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return withStatus.filter((trip) => {
      if (q && !trip.city.toLowerCase().includes(q)) return false
      if (filter === 'completed') return trip.status === 'completed'
      if (filter === 'active') return trip.status !== 'completed'
      return true
    })
  }, [withStatus, query, filter])

  useEffect(() => {
    if (!modalOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModalOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modalOpen])

  const onCreateTrip = (payload: {
    city: string
    startDate: string
    endDate: string
    activityPref: ActivityPref | null
  }) => {
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `trip-${Date.now()}`
    const neu: TripItem = {
      id,
      city: payload.city.trim(),
      startDate: payload.startDate,
      endDate: payload.endDate,
      budget: 0,
      imageUrl:
        'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80',
      activityPref: payload.activityPref,
    }
    persist([neu, ...trips])
    setModalOpen(false)
    toast.success('Đã tạo chuyến đi. Lịch AI sẽ được đồng bộ khi backend sẵn sàng.')
  }

  return (
    <div className="et-page">
      <AppNavbar />
      <main className="et-main">
        <header className="tp-head">
          <div className="tp-head-text">
            <h1>Chuyến đi của bạn</h1>
            <p>Quản lý và theo dõi tất cả các chuyến đi</p>
          </div>
          <button type="button" className="tp-create" onClick={() => setModalOpen(true)}>
            <Plus size={18} strokeWidth={2.5} aria-hidden />
            Tạo chuyến đi
          </button>
        </header>

        <section className="et-grid-section tp-body">
          <div className="tp-toolbar">
            <label className="tp-search">
              <Search size={18} className="tp-icon-muted" aria-hidden />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm kiếm theo tên thành phố..."
                aria-label="Tìm kiếm chuyến đi theo thành phố"
              />
            </label>

            <div className="tp-tabs" role="tablist" aria-label="Lọc chuyến đi">
              <button
                type="button"
                role="tab"
                aria-selected={filter === 'all'}
                className={`tp-tab${filter === 'all' ? ' is-active' : ''}`}
                onClick={() => setFilter('all')}
              >
                Tất cả ({counts.all})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={filter === 'active'}
                className={`tp-tab${filter === 'active' ? ' is-active' : ''}`}
                onClick={() => setFilter('active')}
              >
                Đang diễn ra ({counts.active})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={filter === 'completed'}
                className={`tp-tab${filter === 'completed' ? ' is-active' : ''}`}
                onClick={() => setFilter('completed')}
              >
                Đã hoàn thành ({counts.completed})
              </button>
            </div>
          </div>

          {!hydrated ? (
            <div className="tp-cards">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={`sk-${i}`}
                  className="tp-card"
                  style={{ minHeight: 280, background: '#f3f1ea', border: 'none' }}
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="tp-empty">
              <p>Không có chuyến đi nào khớp bộ lọc. Thử đổi từ khóa hoặc tạo chuyến mới.</p>
            </div>
          ) : (
            <div className="tp-cards">
              {filtered.map((trip) => {
                const statusClass =
                  trip.status === 'completed'
                    ? 'tp-status--completed'
                    : trip.status === 'ongoing'
                      ? 'tp-status--ongoing'
                      : 'tp-status--upcoming'
                return (
                  <article className="tp-card" key={trip.id}>
                    <div className="tp-card-cover">
                      {trip.imageUrl ? (
                        <img src={trip.imageUrl} alt={`Ảnh đại diện chuyến đi ${trip.city}`} loading="lazy" />
                      ) : (
                        <div className="et-card-cover__placeholder" aria-hidden>
                          <Luggage size={28} />
                        </div>
                      )}
                      <span className={`tp-status ${statusClass}`}>{statusLabel(trip.status)}</span>
                      <div className="tp-loc-overlay">
                        <MapPin size={16} aria-hidden />
                        {trip.city}
                      </div>
                    </div>
                    <div className="tp-card-body">
                      <div className="tp-meta-row">
                        <span className="tp-meta-item">
                          <Calendar size={15} aria-hidden />
                          <strong>{formatRangeVi(trip.startDate, trip.endDate)}</strong>
                        </span>
                        <span className="tp-meta-item">
                          <Wallet size={15} aria-hidden />
                          {trip.budget > 0 ? formatVnd(trip.budget) : '—'}
                        </span>
                      </div>
                      <div className="tp-actions">
                        <button
                          type="button"
                          className="tp-action"
                          onClick={() => toast.message('Re-plan', { description: 'Tính năng đang được phát triển.' })}
                        >
                          Re-plan
                        </button>
                        <button
                          type="button"
                          className="tp-action"
                          onClick={() => toast.message('Chi tiết', { description: `${trip.city} · ${trip.startDate}` })}
                        >
                          Xem chi tiết
                        </button>
                        <button
                          type="button"
                          className="tp-action"
                          onClick={() => toast.message('Đánh giá', { description: 'Bạn sẽ gửi đánh giá sau khi hoàn thành chuyến.' })}
                        >
                          Đánh giá
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </main>
      <AppFooter />

      {modalOpen ? (
        <CreateTripModal onClose={() => setModalOpen(false)} onSubmit={onCreateTrip} />
      ) : null}
    </div>
  )
}

function CreateTripModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void
  onSubmit: (p: {
    city: string
    startDate: string
    endDate: string
    activityPref: ActivityPref | null
  }) => void
}) {
  const [city, setCity] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [pref, setPref] = useState<ActivityPref | null>(null)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!city.trim()) {
      toast.error('Vui lòng nhập thành phố.')
      return
    }
    if (!startDate || !endDate) {
      toast.error('Vui lòng chọn ngày đi và ngày về.')
      return
    }
    if (endDate < startDate) {
      toast.error('Ngày về phải sau hoặc trùng ngày đi.')
      return
    }
    onSubmit({ city, startDate, endDate, activityPref: pref })
    setCity('')
    setStartDate('')
    setEndDate('')
    setPref(null)
  }

  return (
    <div
      className="tp-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tp-modal-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="tp-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="tp-modal-head">
          <button type="button" className="tp-modal-close" onClick={onClose} aria-label="Đóng">
            <X size={20} />
          </button>
          <h2 id="tp-modal-title">Tạo chuyến đi mới</h2>
          <p>Nhập thông tin để AI tạo lịch trình tối ưu cho bạn</p>
        </div>
        <form className="tp-modal-form" onSubmit={handleSubmit}>
          <div className="tp-field">
            <label htmlFor="tp-city">Thành phố</label>
            <div className="tp-input-wrap">
              <MapPin size={18} aria-hidden className="tp-icon-muted" />
              <input
                id="tp-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ví dụ: Đà Lạt"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="tp-row-2">
            <div className="tp-field">
              <label htmlFor="tp-start">Ngày đi</label>
              <div className="tp-input-wrap">
                <Calendar size={18} aria-hidden className="tp-icon-muted tp-icon-noshrink" />
                <input
                  id="tp-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  aria-label="Ngày đi"
                />
              </div>
            </div>
            <div className="tp-field">
              <label htmlFor="tp-end">Ngày về</label>
              <div className="tp-input-wrap">
                <Calendar size={18} aria-hidden className="tp-icon-muted tp-icon-noshrink" />
                <input
                  id="tp-end"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  aria-label="Ngày về"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="tp-prefs-title">Sở thích hoạt động</div>
            <div className="tp-prefs">
              <button
                type="button"
                className={`tp-pref${pref === 'outdoor' ? ' is-selected' : ''}`}
                onClick={() => setPref('outdoor')}
              >
                <Sun size={22} aria-hidden />
                Ngoài trời
              </button>
              <button
                type="button"
                className={`tp-pref${pref === 'indoor' ? ' is-selected' : ''}`}
                onClick={() => setPref('indoor')}
              >
                <Home size={22} aria-hidden />
                Trong nhà
              </button>
              <button
                type="button"
                className={`tp-pref${pref === 'both' ? ' is-selected' : ''}`}
                onClick={() => setPref('both')}
              >
                <Luggage size={22} aria-hidden />
                Cả hai
              </button>
            </div>
          </div>

          <button type="submit" className="tp-submit">
            Tạo chuyến đi với AI
          </button>
        </form>
      </div>
    </div>
  )
}

export default Trips
