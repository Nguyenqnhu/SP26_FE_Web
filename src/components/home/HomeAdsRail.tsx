import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Megaphone, Play } from 'lucide-react'
import { axiosClient } from '../../config/axios'
import { parseActiveAdvertisementsResponse, type AdItem } from '../../lib/advertisements'

function adBlurb(ad: AdItem): string {
  const parts = [
    ad.content,
    ad.promotion?.description,
    ad.promotion?.title,
  ].filter(Boolean) as string[]
  const t = parts[0]
  if (t) return t
  return 'Xem chi tiết ưu đãi và thời gian áp dụng trên trang Quảng cáo.'
}

export function HomeAdsRail() {
  const [loading, setLoading] = useState(true)
  const [ads, setAds] = useState<AdItem[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await axiosClient.get<unknown>('advertisements/active')
        setAds(parseActiveAdvertisementsResponse(data))
      } catch {
        setAds([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (!loading && ads.length === 0) return null

  return (
    <section className="hl-ads-rail" aria-labelledby="hl-ads-rail-title">
      <div className="hl-ads-rail__head">
        <div>
          <h2 id="hl-ads-rail-title" className="hl-ads-rail__title">
            Quảng cáo & ưu đãi
          </h2>
          <p className="hl-ads-rail__hint">Kéo ngang để xem thêm</p>
        </div>
        <Link to="/advertisement" className="hl-ads-rail__all">
          Xem tất cả
          <ChevronRight size={18} aria-hidden />
        </Link>
      </div>

      <div className="hl-ads-rail__viewport">
        <div className="hl-ads-rail__track" role="list" tabIndex={0} aria-label="Danh sách quảng cáo cuộn ngang">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <article key={`sk-${i}`} className="hl-ads-rail__slide hl-ads-rail__slide--skeleton" aria-hidden>
                  <div className="hl-ads-rail__skel-img" />
                  <div className="hl-ads-rail__skel-lines">
                    <div className="hl-ads-rail__skel-line hl-ads-rail__skel-line--lg" />
                    <div className="hl-ads-rail__skel-line" />
                    <div className="hl-ads-rail__skel-line hl-ads-rail__skel-line--sm" />
                  </div>
                </article>
              ))
            : ads.map((ad) => (
                <article key={ad.adId} className="hl-ads-rail__slide" role="listitem">
                  <div className="hl-ads-rail__card">
                    <div className="hl-ads-rail__img-wrap">
                      {ad.imageUrl ? (
                        <img src={ad.imageUrl} alt="" className="hl-ads-rail__img" loading="lazy" />
                      ) : ad.videoUrl ? (
                        <div className="hl-ads-rail__img-placeholder" aria-hidden title="Có video — xem trên trang Quảng cáo">
                          <Play size={36} strokeWidth={1.75} />
                        </div>
                      ) : (
                        <div className="hl-ads-rail__img-placeholder" aria-hidden>
                          <Megaphone size={36} />
                        </div>
                      )}
                    </div>
                    <div className="hl-ads-rail__copy">
                      <h3 className="hl-ads-rail__card-title">{ad.title}</h3>
                      <p className="hl-ads-rail__text">{adBlurb(ad)}</p>
                      <Link to="/advertisement" className="hl-btn hl-btn--cream hl-ads-rail__cta">
                        Xem thêm
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
        </div>
      </div>
    </section>
  )
}
