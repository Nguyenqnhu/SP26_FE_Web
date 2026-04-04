import { Star } from 'lucide-react'

type Poi = {
  id: string
  name: string
  description?: string
  imageUrl?: string
  city?: string
  address?: string
}

type HomePoiGridProps = {
  pois: Poi[]
  loading: boolean
}

export function HomePoiGrid({ pois, loading }: HomePoiGridProps) {
  return (
    <section id="featured" className="hl-poi">
      <div className="hl-poi__head">
        <h2 className="hl-poi__title">Địa điểm nổi bật</h2>
        <p className="hl-poi__sub">Gợi ý dành riêng cho bạn dựa trên sở thích và xu hướng.</p>
      </div>
      {loading ? (
        <p className="hl-poi__empty">Đang tải địa điểm...</p>
      ) : pois.length === 0 ? (
        <p className="hl-poi__empty">Chưa có địa điểm gợi ý. Vui lòng thử lại sau.</p>
      ) : (
        <div className="hl-poi__grid">
          {pois.map((p) => {
            const meta = [p.city, p.address, p.description].filter(Boolean).join(' · ') || 'Điểm đến thú vị đang chờ bạn khám phá.'
            const tag = p.city || 'Gợi ý'
            return (
              <article key={p.id} className="hl-poi__card">
                <div className="hl-poi__img-wrap">
                  {p.imageUrl ? (
                    <img className="hl-poi__img" src={p.imageUrl} alt={p.name} loading="lazy" />
                  ) : (
                    <div className="hl-poi__img hl-poi__img--placeholder" aria-hidden>
                      <Star size={22} />
                    </div>
                  )}
                </div>
                <div className="hl-poi__body">
                  <span className="hl-poi__tag">{tag}</span>
                  <h3 className="hl-poi__name">{p.name}</h3>
                  <p className="hl-poi__desc">{meta}</p>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
