import { Link } from 'react-router-dom'
import { Facebook, Instagram, Mail, MapPin, Phone } from 'lucide-react'
import './AppFooter.css'

export function AppFooter() {
  const year = new Date().getFullYear()
  return (
    <footer className="app-footer">
      <div className="app-footer__pattern" aria-hidden />
      <div className="app-footer__inner">
        <div className="app-footer__brand-block">
          <div className="app-footer__logo-row">
            <span className="app-footer__logo-mark" aria-hidden />
            <span className="app-footer__logo-text">TravelGo</span>
          </div>
          <p className="app-footer__tagline">
            Đồng hành cùng bạn khắp mọi miền đất Việt — từ núi rừng Tây Bắc đến biển xanh miền Trung, gọn gàng trong một ứng dụng.
          </p>
          <div className="app-footer__social" aria-label="Mạng xã hội">
            <a href="#" className="app-footer__social-btn" aria-label="Facebook (sắp có)">
              <Facebook size={20} />
            </a>
            <a href="#" className="app-footer__social-btn" aria-label="Instagram (sắp có)">
              <Instagram size={20} />
            </a>
            <a href="mailto:support@travelgo.vn" className="app-footer__social-btn" aria-label="Email">
              <Mail size={20} />
            </a>
          </div>
        </div>

        <div className="app-footer__cols">
          <div>
            <h3 className="app-footer__heading">Khám phá</h3>
            <ul className="app-footer__list">
              <li>
                <Link to="/">Trang chủ</Link>
              </li>
              <li>
                <Link to="/explore">Điểm đến</Link>
              </li>
              <li>
                <Link to="/trips">Chuyến đi của tôi</Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="app-footer__heading">Hỗ trợ</h3>
            <ul className="app-footer__list">
              <li>
                <a href="#faq">Câu hỏi thường gặp</a>
              </li>
              <li>
                <a href="#terms">Điều khoản sử dụng</a>
              </li>
              <li>
                <a href="#privacy">Chính sách bảo mật</a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="app-footer__heading">Liên hệ</h3>
            <ul className="app-footer__contact">
              <li>
                <MapPin size={18} aria-hidden />
                <span>TP. Hồ Chí Minh, Việt Nam</span>
              </li>
              <li>
                <Phone size={18} aria-hidden />
                <a href="tel:1900xxxx">1900 xxxx (demo)</a>
              </li>
              <li>
                <Mail size={18} aria-hidden />
                <a href="mailto:hello@travelgo.vn">hello@travelgo.vn</a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="app-footer__bottom">
        <p>© {year} TravelGo. Made with ❤️ cho cộng đồng du lịch Việt Nam.</p>
        <p className="app-footer__sub">Hình ảnh minh họa — luôn tôn trọng văn hóa & thiên nhiên từng vùng miền.</p>
      </div>
    </footer>
  )
}
