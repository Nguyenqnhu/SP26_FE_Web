import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { axiosClient } from '../../config/axios'
import { toast } from 'sonner'
import hagiang1 from '../../assets/hagiang.png'
import hagiang2 from '../../assets/hagiang2.png'
import './auth.css'

const heroImages = [hagiang1, hagiang2]

const ResetPassword = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const resetToken = (location.state as { resetToken?: string })?.resetToken ?? ''
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentImage, setCurrentImage] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setCurrentImage((p) => (p + 1) % heroImages.length), 5000)
    return () => clearInterval(timer)
  }, [])

  const isInvalid = useMemo(
    () => !resetToken || !newPassword || !confirmPassword || newPassword !== confirmPassword,
    [confirmPassword, newPassword, resetToken],
  )

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!resetToken) {
      toast.error('Phiên đặt lại mật khẩu không hợp lệ. Vui lòng thử lại từ đầu.')
      navigate('/forgot-password')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp.')
      return
    }
    if (newPassword.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự.')
      return
    }
    try {
      setIsLoading(true)
      await axiosClient.post('auth/reset-password', { resetToken, newPassword })
      toast.success('Đổi mật khẩu thành công!')
      navigate('/login')
    } catch (err: unknown) {
      const res = (err as { response?: { data?: { message?: string } } })?.response
      toast.error(res?.data?.message || 'Đặt lại mật khẩu thất bại.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!resetToken) {
    return (
      <div className="auth-page">
        <section className="auth-form-wrap" style={{ gridColumn: '1 / -1' }}>
          <div className="auth-form">
            <p className="error-text">Phiên không hợp lệ. Vui lòng bắt đầu lại.</p>
            <button className="submit-btn" type="button" onClick={() => navigate('/forgot-password')}>
              Quên mật khẩu
            </button>
          </div>
        </section>
      </div>
    )
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
          <h2>TẠO MẬT KHẨU MỚI</h2>
          <p>Nhập mật khẩu mới cho tài khoản của bạn.</p>
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
          <h1 className="auth-title">TẠO MẬT KHẨU MỚI</h1>
          <p className="auth-subtitle">Nhập mật khẩu mới và xác nhận</p>
          <div className="field">
            <label htmlFor="newPassword">Mật khẩu mới</label>
            <div className="password-row">
              <input
                id="newPassword"
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới"
              />
              <button type="button" className="password-toggle" onClick={() => setShowPassword((p) => !p)}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          <div className="field">
            <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu"
            />
          </div>
          <button className="submit-btn" type="submit" disabled={isLoading || isInvalid}>
            {isLoading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
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

export default ResetPassword
