import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, MapPin, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { AppFooter, AppNavbar } from '../../components/layout'
import { axiosClient } from '../../config/axios'
import { loadTrips, saveTrips, type TripItem, updateTripViaStops } from '../../lib/tripStorage'
import './trip-detail.css'

type PoiLite = { id: string; name: string; city?: string }

function uniq<T>(arr: T[]): T[] {
  const seen = new Set<string>()
  const out: T[] = []
  for (const x of arr) {
    const k = String(x)
    if (seen.has(k)) continue
    seen.add(k)
    out.push(x)
  }
  return out
}

function routeLabel(trip: TripItem): string {
  const start = trip.startPoint || trip.city
  const end = trip.endPoint || trip.city
  const mid = (trip.viaStops ?? []).filter(Boolean)
  const base = [start, ...mid, end].filter(Boolean).join(' → ')
  return trip.tripType === 'round_trip' ? `${base} → ${start}` : base
}

const AddSegments = () => {
  const { tripId } = useParams<{ tripId: string }>()
  const navigate = useNavigate()
  const [trip, setTrip] = useState<TripItem | null>(null)
  const [viaStops, setViaStops] = useState<string[]>([])
  const [place, setPlace] = useState('')
  const [loading, setLoading] = useState(true)
  const [suggestions, setSuggestions] = useState<string[]>([])

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) navigate('/login', { replace: true })
  }, [navigate])

  useEffect(() => {
    if (!tripId) {
      navigate('/trips', { replace: true })
      return
    }
    const t = loadTrips().find((x) => x.id === tripId) ?? null
    if (!t) {
      toast.error('Không tìm thấy chuyến đi.')
      navigate('/trips', { replace: true })
      return
    }
    setTrip(t)
    setViaStops(Array.isArray(t.viaStops) ? t.viaStops : [])

    const load = async () => {
      try {
        const { data } = await axiosClient.get<unknown>('pois/recommended', { params: { limit: 50 } })
        const arr = Array.isArray(data)
          ? data
          : (data as { items?: unknown[]; data?: unknown[] })?.items ??
            (data as { data?: unknown[] })?.data ??
            []
        const pois = arr.map((p, i) => {
          const x = p as Record<string, unknown>
          return {
            id: String(x.id ?? i),
            name: String(x.name ?? ''),
            city: (x.city as string | undefined) ?? undefined,
          } satisfies PoiLite
        })
        const cities = uniq(
          pois
            .flatMap((p) => [p.city].filter(Boolean) as string[])
            .map((c) => c.trim())
            .filter(Boolean),
        )
        setSuggestions(cities)
      } catch {
        setSuggestions(['Hà Nội', 'Đà Nẵng', 'Hội An', 'TP. Hồ Chí Minh', 'Huế', 'Đà Lạt', 'Nha Trang'])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [tripId, navigate])

  const canAdd = place.trim().length > 0

  const onAdd = () => {
    const p = place.trim()
    if (!p) return
    setViaStops((prev) => [...prev, p])
    setPlace('')
  }

  const onRemove = (idx: number) => {
    setViaStops((prev) => prev.filter((_, i) => i !== idx))
  }

  const onDone = () => {
    if (!tripId || !trip) return
    updateTripViaStops(tripId, viaStops)
    // sync state list in storage already; ensure local trip state updated
    const list = loadTrips()
    saveTrips(list)
    toast.success('Đã lưu lộ trình.')
    navigate(`/trips/${tripId}`)
  }

  const summary = useMemo(() => (trip ? routeLabel({ ...trip, viaStops }) : ''), [trip, viaStops])

  if (!tripId || !trip) return null

  return (
    <div className="td-page et-page">
      <AppNavbar />
      <main className="td-main">
        <button type="button" className="td-back" onClick={() => navigate('/trips')}>
          <ArrowLeft size={18} aria-hidden />
          Quay lại danh sách
        </button>

        <section className="td-hero" aria-label="Tạo lộ trình">
          <div className="td-hero__accent" aria-hidden />
          <div className="td-hero__inner">
            <span className="td-hero__badge">
              <MapPin size={14} aria-hidden />
              Thêm segment
            </span>
            <h2 className="td-hero__title">Chọn các điểm bạn muốn đi qua</h2>
            <p className="td-hero__range" style={{ marginBottom: 10 }}>
              {summary || '—'}
            </p>
            <div className="td-hero__stats">
              <div className="td-hero__stat">
                <strong>{viaStops.length}</strong>
                <span>điểm dừng trung gian</span>
              </div>
            </div>
          </div>
        </section>

        <div className="td-cal-shell" style={{ marginTop: 18 }}>
          <div className="td-cal-shell__head" style={{ marginBottom: 10 }}>
            <span className="td-cal-shell__month">Thêm điểm dừng</span>
            <span className="td-cal-shell__hint">Có thể nhập tay hoặc chọn từ gợi ý</span>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div className="tp-input-wrap" style={{ flex: 1 }}>
              <MapPin size={18} aria-hidden className="tp-icon-muted" />
              <input
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                list="segment-suggestions"
                placeholder="VD: Đà Nẵng"
                aria-label="Điểm dừng"
              />
              <datalist id="segment-suggestions">
                {suggestions.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <button
              type="button"
              className="td-cal-nav"
              onClick={onAdd}
              disabled={!canAdd}
              aria-label="Thêm điểm dừng"
              title="Thêm"
            >
              <Plus size={20} />
            </button>
          </div>

          <div style={{ marginTop: 14 }}>
            {viaStops.length === 0 ? (
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem', lineHeight: 1.5 }}>
                Chưa có điểm dừng. Bạn có thể thêm Đà Nẵng, Hội An… rồi bấm Lưu &amp; xem chi tiết.
              </p>
            ) : (
              <div className="tp-pref-grid" style={{ maxHeight: 220 }}>
                {viaStops.map((s, idx) => (
                  <span
                    key={`${s}-${idx}`}
                    className="tp-pref-chip is-selected"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                  >
                    {s}
                    <button
                      type="button"
                      onClick={() => onRemove(idx)}
                      aria-label={`Xóa ${s}`}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'inline-flex',
                        color: 'inherit',
                      }}
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            className="tp-submit"
            style={{ marginTop: 16 }}
            onClick={onDone}
            disabled={loading}
          >
            Lưu &amp; xem chi tiết
          </button>
        </div>
      </main>
      <AppFooter />
    </div>
  )
}

export default AddSegments

