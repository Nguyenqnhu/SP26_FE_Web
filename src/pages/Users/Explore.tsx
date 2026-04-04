import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  MapPin,
  Search,
  Sparkles,
  Star,
} from 'lucide-react'
import { AppFooter, AppNavbar } from '../../components/layout'
import { axiosClient } from '../../config/axios'
import { pickPoiImageUrl, unwrapApiArray } from '../../lib/poiImageUrl'
import './explore-trips.css'

type Poi = {
  id: string
  name: string
  description?: string
  imageUrl?: string
  city?: string
  address?: string
}

const PAGE_SIZE = 9

const Explore = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [poiList, setPoiList] = useState<Poi[]>([])
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState('default')
  const [activePage, setActivePage] = useState(1)

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) navigate('/login', { replace: true })
  }, [navigate])

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await axiosClient.get<unknown>('pois/recommended', { params: { limit: 10 } })
        const arr = unwrapApiArray(data)

        const list = arr.map((p, i) => {
          const x = p as Record<string, unknown>
          return {
            id: String(x.id ?? i),
            name: String(x.name ?? 'Địa điểm'),
            description: x.description as string | undefined,
            imageUrl: pickPoiImageUrl(x),
            city: x.city as string | undefined,
            address: x.address as string | undefined,
          }
        })
        setPoiList(list)
      } catch {
        setPoiList([])
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const base = q
      ? poiList.filter((p) => `${p.name} ${p.city ?? ''} ${p.address ?? ''}`.toLowerCase().includes(q))
      : poiList

    if (sortBy === 'name-asc') {
      return [...base].sort((a, b) => a.name.localeCompare(b.name, 'vi'))
    }
    if (sortBy === 'name-desc') {
      return [...base].sort((a, b) => b.name.localeCompare(a.name, 'vi'))
    }
    return base
  }, [poiList, query, sortBy])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))

  useEffect(() => {
    setActivePage(1)
  }, [query, sortBy])

  useEffect(() => {
    if (activePage > totalPages) setActivePage(totalPages)
  }, [activePage, totalPages])

  const currentItems = useMemo(() => {
    const start = (activePage - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, activePage])

  const pageNumbers = useMemo(() => {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }, [totalPages])

  return (
    <div className="et-page">
      <AppNavbar />
      <main className="et-main">
        <section className="et-hero">
          <span className="et-badge">
            <Sparkles size={16} /> Khám phá địa điểm
          </span>
          <h1 className="et-title">Gợi ý điểm đến dành riêng cho bạn</h1>
          <p className="et-lead">
            Chạm để xem nhanh các nơi nổi bật, lọc theo tên/thành phố và sắp xếp theo sở thích của bạn.
          </p>
        </section>

        <section className="et-grid-section">
          <div className="et-toolbar">
            <label className="et-search">
              <Search size={16} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm địa điểm, thành phố..."
                aria-label="Tìm địa điểm"
              />
            </label>

            <label className="et-sort">
              <span>Sắp xếp:</span>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sắp xếp địa điểm">
                <option value="default">Mặc định</option>
                <option value="name-asc">Tên A-Z</option>
                <option value="name-desc">Tên Z-A</option>
              </select>
            </label>
          </div>

          {loading ? (
            <div className="et-cards">
              {Array.from({ length: PAGE_SIZE }).map((_, idx) => (
                <article className="et-card et-card--skeleton" key={`skeleton-${idx}`} />
              ))}
            </div>
          ) : currentItems.length === 0 ? (
            <div className="et-empty">
              <Sparkles size={18} />
              <p>Không có địa điểm phù hợp. Bạn thử đổi từ khóa nhé.</p>
            </div>
          ) : (
            <>
              <div className="et-cards">
                {currentItems.map((poi) => {
                  const location = [poi.city, poi.address].filter(Boolean).join(', ') || 'Việt Nam'
                  const blurb = poi.description || 'Điểm đến tuyệt vời cho hành trình kế tiếp của bạn.'

                  return (
                    <article className="et-card" key={poi.id}>
                      <div className="et-card-cover">
                        {poi.imageUrl ? (
                          <img src={poi.imageUrl} alt={poi.name} loading="lazy" />
                        ) : (
                          <div className="et-card-cover__placeholder" aria-hidden>
                            <Star size={18} />
                          </div>
                        )}
                        <button type="button" className="et-fav" aria-label={`Lưu ${poi.name}`}>
                          <Heart size={15} />
                        </button>
                      </div>

                      <div className="et-card-body">
                        <h3>{poi.name}</h3>
                        <p className="et-meta">
                          <MapPin size={14} /> {location}
                        </p>
                        <p className="et-desc">{blurb}</p>
                      </div>
                    </article>
                  )
                })}
              </div>

              {totalPages > 1 && (
                <div className="et-pagination">
                  <button
                    type="button"
                    onClick={() => setActivePage((p) => Math.max(1, p - 1))}
                    disabled={activePage === 1}
                    aria-label="Trang trước"
                  >
                    <ChevronLeft size={14} />
                  </button>

                  {pageNumbers.map((num) => (
                    <button
                      type="button"
                      key={num}
                      className={num === activePage ? 'is-active' : ''}
                      onClick={() => setActivePage(num)}
                    >
                      {num}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setActivePage((p) => Math.min(totalPages, p + 1))}
                    disabled={activePage === totalPages}
                    aria-label="Trang sau"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </>
          )}

          <div className="et-bottom-row">
            <p className="et-note">
              Hiển thị {currentItems.length} / {filtered.length} địa điểm.
            </p>
            <Link to="/" className="et-back">
              ← Về trang chủ
            </Link>
          </div>
        </section>
      </main>
      <AppFooter />
    </div>
  )
}

export default Explore
