type HomeHighlightBannerProps = {
  img: string
  onCta: () => void
}

export function HomeHighlightBanner({ img, onCta }: HomeHighlightBannerProps) {
  return (
    <section className="hl-banner" aria-label="Nổi bật">
      <div className="hl-banner__inner">
        <div className="hl-banner__img-wrap">
          <img src={img} alt="" className="hl-banner__img" />
        </div>
        <div className="hl-banner__copy">
          <h2 className="hl-banner__title">Vị trí quảng cáo (đối tác địa phương)</h2>
          <p className="hl-banner__text">
            Dán mã Google AdSense hoặc banner nhà cung cấp tour Việt Nam vào đây khi tích hợp.
          </p>
          <button type="button" className="hl-btn hl-btn--cream" onClick={onCta}>
            Xem thêm
          </button>
        </div>
      </div>
    </section>
  )
}
