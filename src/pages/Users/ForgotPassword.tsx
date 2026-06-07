import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { axiosClient } from '../../config/axios'
import { toast } from 'sonner'
import hagiang1 from '../../assets/hagiang.png'
import hagiang2 from '../../assets/hagiang2.png'
import './auth.css'

const heroImages = [hagiang1, hagiang2]

const ForgotPassword = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentImage, setCurrentImage] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setCurrentImage((p) => (p + 1) % heroImages.length), 5000)
    return () => clearInterval(timer)
  }, [])

  const isInvalid = useMemo(() => !email.trim(), [email])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (isInvalid) {
      toast.error('Vui lòng nhập email.')
      return
    }
    try {
      setIsLoading(true)
      await axiosClient.post('auth/request-password-reset', { email: email.trim() })
      toast.success('Đã gửi mã OTP về email của bạn.')
      navigate('/verify-reset-otp', { state: { email: email.trim() } })
    } catch (err: unknown) {
      const res = (err as { response?: { data?: { message?: string } } })?.response
      toast.error(res?.data?.message || 'Gửi OTP thất bại.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-hero">
        <div className="auth-hero-slider">
          {heroImages.map((src, i) => (
            <img key={i} src={src} alt="Hà Giang" className={`auth-hero-img ${i === currentImage ? 'active' : ''}`} />
          ))}
        </div>
        <div className="auth-hero-overlay">
          <h2>QUÊN MẬT KHẨU</h2>
          <p>Nhập email để nhận mã OTP đặt lại mật khẩu.</p>
        </div>
        <div className="auth-hero-dots">
          {heroImages.map((_, i) => (
            <button key={i} type="button" className={i === currentImage ? 'active' : ''} onClick={() => setCurrentImage(i)} aria-label={`Ảnh ${i + 1}`} />
          ))}
        </div>
      </section>
      <section className="auth-form-wrap">
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-brand">TravelGo</div>
          <h1 className="auth-title">QUÊN MẬT KHẨU</h1>
          <p className="auth-subtitle">Nhập email đăng ký để nhận mã OTP</p>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Nhập email của bạn" />
          </div>
          <button className="submit-btn" type="submit" disabled={isLoading}>
            {isLoading ? 'Đang gửi...' : 'Gửi mã OTP'}
          </button>
          <p className="switch-auth">
            Nhớ mật khẩu?
            <button type="button" onClick={() => navigate('/login')}> Đăng nhập</button>
          </p>
        </form>
      </section>
    </div>
  )
}

export default ForgotPassword
