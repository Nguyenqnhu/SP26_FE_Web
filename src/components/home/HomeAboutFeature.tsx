type HomeAboutFeatureProps = {
  imgPortrait: string
  imgWide: string
}

export function HomeAboutFeature({ imgPortrait, imgWide }: HomeAboutFeatureProps) {
  return (
    <section id="about" className="hl-about">
      <div className="hl-about__top">
        <div className="hl-about__portrait-wrap">
          <img className="hl-about__portrait" src={imgPortrait} alt="Cảnh đẹp Việt Nam" />
        </div>
        <div className="hl-about__text">
          <h2 className="hl-about__h2">Chào mừng đến TravelGo</h2>
          <p className="hl-about__intro">
            Chúng tôi không chỉ gợi ý điểm đến — mà còn cá nhân hóa trải nghiệm theo sở thích, ngân sách và thời gian rảnh của bạn, đúng nhịp sống Việt.
          </p>
          <h3 className="hl-about__h3">Hơn cả một chuyến đi — là kỷ niệm quê hương</h3>
          <p className="hl-about__p">
            Từ gợi ý lịch trình thông minh đến bản đồ trực quan và cập nhật thời tiết, TravelGo mang đến nền tảng du lịch hiện đại nhưng vẫn ấm áp, dễ hiểu cho mọi lứa tuổi.
          </p>
          <div className="hl-about__pills">
            <a className="hl-pill hl-pill--outline" href="#featured">
              Địa điểm nổi bật
            </a>
            <a className="hl-pill hl-pill--outline" href="#why">
              Tìm hiểu thêm
            </a>
          </div>
          <div className="hl-about__stats">
            <div>
              <span className="hl-about__num">50+</span>
              <span className="hl-about__lbl">Đối tác</span>
            </div>
            <div>
              <span className="hl-about__num">1K+</span>
              <span className="hl-about__lbl">Lộ trình</span>
            </div>
            <div>
              <span className="hl-about__num">10K+</span>
              <span className="hl-about__lbl">Người dùng</span>
            </div>
            <div>
              <span className="hl-about__num">24/7</span>
              <span className="hl-about__lbl">Hỗ trợ</span>
            </div>
          </div>
        </div>
      </div>
      <div className="hl-about__wide-row">
        <img className="hl-about__wide" src={imgWide} alt="Khung cảnh thiên nhiên" />
      </div>
    </section>
  )
}
