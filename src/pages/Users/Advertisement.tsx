import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bookmark, CalendarRange, ChevronLeft, ChevronRight, Gift, Megaphone, Play } from 'lucide-react'
import { AppFooter, AppNavbar } from '../../components/layout'
import { axiosClient } from '../../config/axios'
import { type AdItem, parseActiveAdvertisementsResponse } from '../../lib/advertisements'
import './explore-trips.css'
import './advertisement.css'

function formatDateRange(startIso: string, endIso: string): string {
  if (!startIso && !endIso) return ''
  const opt: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }
  try {
    const a = startIso ? new Date(startIso) : null
    const b = endIso ? new Date(endIso) : null
    if (a && b && !Number.isNaN(a.getTime()) && !Number.isNaN(b.getTime())) {
      return `${a.toLocaleDateString('vi-VN', opt)} — ${b.toLocaleDateString('vi-VN', opt)}`
    }
    if (a && !Number.isNaN(a.getTime())) return `Từ ${a.toLocaleDateString('vi-VN', opt)}`
    if (b && !Number.isNaN(b.getTime())) return `Đến ${b.toLocaleDateString('vi-VN', opt)}`
  } catch {
    /* ignore */
  }
  return [startIso, endIso].filter(Boolean).join(' — ')
}

const PAGE_SIZE = 6

const AdvertisementPage = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ads, setAds] = useState<AdItem[]>([])
  const [activePage, setActivePage] = useState(1)

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) navigate('/login', { replace: true })
  }, [navigate])

  useEffect(() => {
    const load = async () => {
      setError(null)
      try {
        const { data } = await axiosClient.get<unknown>('advertisements/active')
        setAds(parseActiveAdvertisementsResponse(data))
      } catch {
        setAds([])
        setError('Không tải được danh sách quảng cáo. Bạn thử tải lại trang sau ít phút.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const totalPages = Math.max(1, Math.ceil(ads.length / PAGE_SIZE))

  useEffect(() => {
    if (activePage > totalPages) setActivePage(totalPages)
  }, [activePage, totalPages])

  const currentItems = useMemo(() => {
    const start = (activePage - 1) * PAGE_SIZE
    return ads.slice(start, start + PAGE_SIZE)
  }, [ads, activePage])

  const pageNumbers = useMemo(() => Array.from({ length: totalPages }, (_, i) => i + 1), [totalPages])

  return (
    <div className="et-page">
      <AppNavbar />
      <main className="et-main">
        <section className="et-hero">
          <span className="et-badge et-badge--green">
            <Megaphone size={16} /> Quảng cáo & ưu đãi
          </span>
          <h1 className="et-title">Ưu đãi đang diễn ra</h1>
          <p className="et-lead">
            Xem nhanh các chiến dịch quảng cáo đang hoạt động cùng khuyến mãi kèm theo — cập nhật trực tiếp từ hệ thống.
          </p>
        </section>

        <section className="et-grid-section">
          {error && (
            <div className="adv-banner adv-banner--warn" role="alert">
              {error}
            </div>
          )}

          {loading ? (
            <div className="et-cards adv-cards">
              {Array.from({ length: PAGE_SIZE }).map((_, idx) => (
                <article className="et-card adv-card adv-card--skeleton" key={`sk-${idx}`} aria-hidden>
                  <div className="adv-card__skel-thumb" />
                  <div className="adv-card__skel-lines">
                    <div className="adv-card__skel-line adv-card__skel-line--title" />
                    <div className="adv-card__skel-line" />
                    <div className="adv-card__skel-line adv-card__skel-line--short" />
                  </div>
                </article>
              ))}
            </div>
          ) : ads.length === 0 ? (
            <div className="et-empty">
              <Gift size={18} />
              <p>Hiện chưa có quảng cáo đang hoạt động.</p>
            </div>
          ) : (
            <>
              <div className="et-cards adv-cards">
                {currentItems.map((ad) => {
                  const dateLabel = formatDateRange(ad.startDate, ad.endDate)
                  const hasVideo = Boolean(ad.videoUrl)

                  return (
                    <article className="et-card adv-card" key={ad.adId}>
                      <div className="et-card-cover adv-card__cover">
                        {hasVideo ? (
                          <video className="adv-card__media" src={ad.videoUrl} controls playsInline />
                        ) : ad.imageUrl ? (
                          <img src={ad.imageUrl} alt={ad.title} loading="lazy" />
                        ) : (
                          <div className="et-card-cover__placeholder adv-card__placeholder" aria-hidden>
                            <Megaphone size={22} />
                          </div>
                        )}
                        {hasVideo ? (
                          <span className="adv-card__media-tag" aria-hidden>
                            <Play size={12} fill="currentColor" />
                          </span>
                        ) : null}
                        <span
                          className={`adv-status ${ad.status.toLowerCase() === 'active' ? 'adv-status--active' : ''}`}
                        >
                          {ad.status}
                        </span>
                      </div>

                      <div className="et-card-body adv-card__body">
                        <h3>{ad.title}</h3>
                        {ad.content ? <p className="et-desc adv-card__content">{ad.content}</p> : null}
                        {dateLabel ? (
                          <p className="et-meta adv-card__dates">
                            <CalendarRange size={14} aria-hidden />
                            {dateLabel}
                          </p>
                        ) : null}

                        {ad.promotion ? (
                          <div className="adv-promo">
                            <div className="adv-promo__head">
                              <Gift size={16} className="adv-promo__icon" aria-hidden />
                              <span className="adv-promo__label">Ưu đãi kèm theo</span>
                              <span className="adv-promo__pill">{ad.promotion.status}</span>
                            </div>
                            {ad.promotion.title ? <h4 className="adv-promo__title">{ad.promotion.title}</h4> : null}
                            {ad.promotion.description ? (
                              <p className="adv-promo__text">{ad.promotion.description}</p>
                            ) : null}
                            {ad.promotion.terms ? (
                              <p className="adv-promo__terms">
                                <strong>Điều kiện:</strong> {ad.promotion.terms}
                              </p>
                            ) : null}
                            <p className="adv-promo__saves">
                              <Bookmark size={14} aria-hidden />
                              {ad.promotion.saveCount} lượt lưu
                            </p>
                          </div>
                        ) : null}
                      </div>
                    </article>
                  )
                })}
              </div>

              {totalPages > 1 && (
                <div className="et-pagination adv-pagination">
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

              <div className="et-bottom-row">
                <p className="et-note">
                  Hiển thị {currentItems.length} / {ads.length} quảng cáo.
                </p>
                <Link to="/explore" className="et-back">
                  ← Khám phá địa điểm
                </Link>
              </div>
            </>
          )}
        </section>
      </main>
      <AppFooter />
    </div>
  )
}

export default AdvertisementPage
