import { AnimatePresence, motion } from 'framer-motion'

type HomeHeroProps = {
  images: string[]
  activeIndex: number
  onDotClick: (i: number) => void
  onExplore: () => void
  onAbout: () => void
}

export function HomeHero({ images, activeIndex, onDotClick, onExplore, onAbout }: HomeHeroProps) {
  return (
    <section className="hl-hero" aria-label="Giới thiệu TravelGo">
      <div className="hl-hero__grid">
        <div className="hl-hero__copy">
          <p className="hl-hero__kicker">Du lịch Việt — gọn trong tay bạn</p>
          <h1 className="hl-hero__title">Chúng tôi đồng hành cùng hành trình của bạn</h1>
          <p className="hl-hero__lead">
            TravelGo giúp bạn lên kế hoạch, khám phá và tận hưởng từng chuyến đi — thân thiện, rõ ràng và đúng chất người Việt.
          </p>
          <div className="hl-hero__actions">
            <button type="button" className="hl-btn hl-btn--primary" onClick={onExplore}>
              Khám phá ngay
            </button>
            <button type="button" className="hl-btn hl-btn--outline" onClick={onAbout}>
              Về chúng tôi
            </button>
          </div>
        </div>

        <div className="hl-hero__visual">
          <div className="hl-hero__frame">
            <AnimatePresence mode="wait">
              <motion.img
                key={activeIndex}
                src={images[activeIndex]}
                alt=""
                className="hl-hero__img"
                initial={{ opacity: 0, scale: 1.06 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              />
            </AnimatePresence>
            <div className="hl-hero__dots" role="tablist" aria-label="Ảnh minh họa">
              {images.map((_, i) => (
                <button
                  key={String(i)}
                  type="button"
                  role="tab"
                  aria-selected={activeIndex === i}
                  className={`hl-hero__dot ${activeIndex === i ? 'hl-hero__dot--on' : ''}`}
                  onClick={() => onDotClick(i)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
