import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { axiosClient } from '../../config/axios'
import { toast } from 'sonner'
import hagiang1 from '../../assets/hagiang.png'
import hagiang2 from '../../assets/hagiang2.png'
import './auth.css'

const heroImages = [hagiang1, hagiang2]

const VerifyResetOtp = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const emailFromState = (location.state as { email?: string })?.email ?? ''
  const [email, setEmail] = useState(emailFromState)
  const [otpCode, setOtpCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentImage, setCurrentImage] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setCurrentImage((p) => (p + 1) % heroImages.length), 5000)
    return () => clearInterval(timer)
  }, [])

  const isInvalid = useMemo(() => !email.trim() || !otpCode.trim(), [email, otpCode])

  const handleVerify = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (isInvalid) {
      toast.error('Vui lòng nhập email và mã OTP.')
      return
    }
    try {
      setIsLoading(true)
      const { data } = await axiosClient.post<{ resetToken?: string }>('auth/verify-reset-password-otp', {
        email: email.trim(),
        otpCode,
      })
      const token = data?.resetToken
      if (token) {
        toast.success('Xác thực thành công!')
        navigate('/reset-password', { state: { resetToken: token } })
      } else {
        toast.error('Không nhận được mã đặt lại mật khẩu.')
      }
    } catch (err: unknown) {
      const res = (err as { response?: { data?: { message?: string } } })?.response
      toast.error(res?.data?.message || 'OTP không hợp lệ hoặc đã hết hạn.')
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
          <h2>XÁC THỰC OTP</h2>
          <p>Nhập mã OTP đã gửi về email để đặt lại mật khẩu.</p>
        </div>
        <div className="auth-hero-dots">
          {heroImages.map((_, i) => (
            <button key={i} type="button" className={i === currentImage ? 'active' : ''} onClick={() => setCurrentImage(i)} aria-label={`Ảnh ${i + 1}`} />
          ))}
        </div>
      </section>
      <section className="auth-form-wrap">
        <form className="auth-form" onSubmit={handleVerify}>
          <div className="auth-brand">TravelGo</div>
          <h1 className="auth-title">XÁC THỰC OTP</h1>
          <p className="auth-subtitle">Nhập mã OTP đã nhận để tiếp tục</p>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Nhập email" />
          </div>
          <div className="field">
            <label htmlFor="otpCode">Mã OTP</label>
            <input id="otpCode" type="text" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} placeholder="Nhập mã OTP" maxLength={6} />
          </div>
          <button className="submit-btn" type="submit" disabled={isLoading}>
            {isLoading ? 'Đang xác thực...' : 'Xác thực'}
          </button>
          <p className="switch-auth">
            Quay lại?
            <button type="button" onClick={() => navigate('/forgot-password')}> Quên mật khẩu</button>
          </p>
        </form>
      </section>
    </div>
  )
}

export default VerifyResetOtp
