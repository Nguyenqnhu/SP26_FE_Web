import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadTrips, saveTrips, type TripItem } from '../../lib/tripStorage'
import {
  Calendar,
  Luggage,
  MapPin,
  Plus,
  Search,
  Wallet,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { AppFooter, AppNavbar } from '../../components/layout'
import './explore-trips.css'
import './trip-page.css'

type TripStatus = 'upcoming' | 'ongoing' | 'completed'

type FilterTab = 'all' | 'active' | 'completed'

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

function formatVnd(n: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(n)} đ`
}

function formatRangeVi(start: string, end: string): string {
  const a = parseYMD(start)
  const b = parseYMD(end)
  const opt: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'numeric', year: 'numeric' }
  return `${a.toLocaleDateString('vi-VN', opt)} - ${b.toLocaleDateString('vi-VN', opt)}`
}

type TripType = 'one_way' | 'round_trip'

const Trips = () => {
  const navigate = useNavigate()
  const [trips, setTrips] = useState<TripItem[]>(() => loadTrips())
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<FilterTab>('all')
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) navigate('/login', { replace: true })
  }, [navigate])

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

  const handleCreateTrip = async (payload: {
    startPoint: string
    endPoint: string
    tripType: TripType
    startDate: string
    endDate: string
  }) => {
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `trip-${Date.now()}`

    try {
      const neu: TripItem = {
        id,
        city: payload.endPoint.trim() || payload.startPoint.trim(),
        startPoint: payload.startPoint.trim(),
        endPoint: payload.endPoint.trim(),
        tripType: payload.tripType,
        viaStops: [],
        startDate: payload.startDate,
        endDate: payload.endDate,
        budget: 0,
        imageUrl:
          'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80',
      }
      setTrips((prev) => {
        const next = [neu, ...prev]
        saveTrips(next)
        return next
      })
      setModalOpen(false)
      toast.success('Đã tạo trip. Hãy thêm segment cho lộ trình.')
      navigate(`/trips/${id}/segments`)
    } catch {
      toast.error('Không tạo được trip. Thử lại sau.')
    }
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

          {filtered.length === 0 ? (
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
                          onClick={() =>
                            toast.message('Re-plan', { description: 'Tính năng đang được phát triển.' })
                          }
                        >
                          Re-plan
                        </button>
                        <button
                          type="button"
                          className="tp-action"
                          onClick={() => navigate(`/trips/${trip.id}`)}
                        >
                          Xem chi tiết
                        </button>
                        <button
                          type="button"
                          className="tp-action"
                          onClick={() =>
                            toast.message('Đánh giá', {
                              description: 'Bạn sẽ gửi đánh giá sau khi hoàn thành chuyến.',
                            })
                          }
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
        <CreateTripModal
          onClose={() => setModalOpen(false)}
          onSubmit={handleCreateTrip}
        />
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
    startPoint: string
    endPoint: string
    tripType: TripType
    startDate: string
    endDate: string
  }) => Promise<void>
}) {
  const [startPoint, setStartPoint] = useState('')
  const [endPoint, setEndPoint] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [tripType, setTripType] = useState<TripType>('round_trip')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!startPoint.trim()) {
      toast.error('Vui lòng nhập điểm bắt đầu.')
      return
    }
    if (!endPoint.trim()) {
      toast.error('Vui lòng nhập điểm kết thúc.')
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

    try {
      setSubmitting(true)
      await onSubmit({ startPoint, endPoint, tripType, startDate, endDate })
      setStartPoint('')
      setEndPoint('')
      setStartDate('')
      setEndDate('')
      setTripType('round_trip')
    } finally {
      setSubmitting(false)
    }
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
            <label htmlFor="tp-startPoint">Điểm bắt đầu</label>
            <div className="tp-input-wrap">
              <MapPin size={18} aria-hidden className="tp-icon-muted" />
              <input
                id="tp-startPoint"
                value={startPoint}
                onChange={(e) => setStartPoint(e.target.value)}
                placeholder="Ví dụ: Hà Nội"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="tp-field">
            <label htmlFor="tp-endPoint">Điểm kết thúc</label>
            <div className="tp-input-wrap">
              <MapPin size={18} aria-hidden className="tp-icon-muted" />
              <input
                id="tp-endPoint"
                value={endPoint}
                onChange={(e) => setEndPoint(e.target.value)}
                placeholder="Ví dụ: TP. Hồ Chí Minh"
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
            <div className="tp-prefs-title">Kiểu du lịch</div>
            <p className="tp-prefs-hint">Chọn 1 chiều hoặc khứ hồi</p>
            <div className="tp-triptype" role="radiogroup" aria-label="Kiểu du lịch">
              <button
                type="button"
                className={`tp-triptype__btn${tripType === 'one_way' ? ' is-selected' : ''}`}
                onClick={() => setTripType('one_way')}
                role="radio"
                aria-checked={tripType === 'one_way'}
              >
                1 chiều
              </button>
              <button
                type="button"
                className={`tp-triptype__btn${tripType === 'round_trip' ? ' is-selected' : ''}`}
                onClick={() => setTripType('round_trip')}
                role="radio"
                aria-checked={tripType === 'round_trip'}
              >
                Khứ hồi
              </button>
            </div>
          </div>

          <button type="submit" className="tp-submit" disabled={submitting}>
            {submitting ? 'Đang tạo trip…' : 'Tạo trip'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Trips
