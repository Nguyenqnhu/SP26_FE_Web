import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Calendar, Luggage, Plane } from 'lucide-react'
import { AppFooter, AppNavbar } from '../../components/layout'
import './explore-trips.css'

const Trips = () => {
  const navigate = useNavigate()
  useEffect(() => {
    if (!localStorage.getItem('accessToken')) navigate('/login', { replace: true })
  }, [navigate])

  return (
    <div className="et-page">
      <AppNavbar />
      <main className="et-main">
        <section className="et-hero et-hero--trips">
          <span className="et-badge et-badge--green">
            <Luggage size={16} /> Chuyến đi của bạn
          </span>
          <h1 className="et-title">Lưu giữ kỷ niệm mỗi hành trình</h1>
          <p className="et-lead">
            Xem lại lịch trình đã lên, chỉnh sở thích và chuẩn bị cho chuyến đi tiếp theo — tất cả gọn trong một nơi.
          </p>
        </section>

        <section className="et-grid-section">
          <h2 className="et-h2">Sắp ra mắt</h2>
          <div className="et-cards et-cards--two">
            <article className="et-card">
              <div className="et-card-icon">
                <Calendar />
              </div>
              <h3>Lịch trình đã lưu</h3>
              <p>Đồng bộ với AI gợi ý và cập nhật theo thời tiết.</p>
            </article>
            <article className="et-card">
              <div className="et-card-icon et-card-icon--red">
                <Plane />
              </div>
              <h3>Chuyến đi sắp tới</h3>
              <p>Nhắc nhở vé, khách sạn và điểm hẹn trên bản đồ.</p>
            </article>
          </div>
          <p className="et-note">
            Khi backend sẵn sàng, danh sách chuyến đi thật sẽ hiển thị tại đây.
          </p>
          <Link to="/explore" className="et-back">
            Khám phá điểm đến →
          </Link>
        </section>
      </main>
      <AppFooter />
    </div>
  )
}

export default Trips
