import type { LucideIcon } from 'lucide-react'

export type WhyItem = {
  icon: LucideIcon
  title: string
  desc: string
}

type HomeWhySectionProps = {
  items: readonly WhyItem[]
}

export function HomeWhySection({ items }: HomeWhySectionProps) {
  return (
    <section id="why" className="hl-why">
      <div className="hl-why__head">
        <h2 className="hl-why__title">Tại sao chọn chúng tôi</h2>
        <p className="hl-why__sub">Những lợi ích giúp bạn lên kế hoạch gọn mà vẫn trọn vẹn.</p>
      </div>
      <div className="hl-why__grid">
        {items.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="hl-why__card">
            <div className="hl-why__icon">
              <Icon size={26} strokeWidth={1.6} />
            </div>
            <h3 className="hl-why__card-title">{title}</h3>
            <p className="hl-why__card-desc">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
