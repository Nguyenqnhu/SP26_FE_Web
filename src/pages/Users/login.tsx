import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { axiosClient, normalizeStoredToken } from '../../config/axios'
import { toast } from 'sonner'
import hagiang1 from '../../assets/hagiang.png'
import hagiang2 from '../../assets/hagiang2.png'
import './auth.css'

const heroImages = [hagiang1, hagiang2]

const Login = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentImage, setCurrentImage] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % heroImages.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const isInvalid = useMemo(() => !email.trim() || !password.trim(), [email, password])

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (isInvalid) {
      toast.error('Vui lòng điền email và mật khẩu.')
      return
    }

    try {
      setIsLoading(true)
      const response = await axiosClient.post('auth/login', { email: email.trim(), password })
      const data = response.data as Record<string, unknown>
      const nested = data?.data && typeof data.data === 'object' ? (data.data as Record<string, unknown>) : null
      const tokenRaw =
        [
          data?.token,
          data?.Token,
          data?.accessToken,
          data?.AccessToken,
          nested?.token,
          nested?.accessToken,
          nested?.AccessToken,
        ].find((v): v is string => typeof v === 'string' && v.length > 0) ?? null
      if (!tokenRaw) {
        toast.error('Đăng nhập thành công nhưng không nhận được token. Kiểm tra response API (token).')
        setIsLoading(false)
        return
      }
      const clean = normalizeStoredToken(tokenRaw)
      localStorage.setItem('accessToken', clean)
      if (remember) localStorage.setItem('accessToken', clean)
      localStorage.setItem('userEmail', email.trim())
      window.dispatchEvent(new Event('travelgo-auth'))
      navigate('/preferences', { replace: true })
      toast.success('Đăng nhập thành công!')
    } catch (err: unknown) {
      setIsLoading(false)
      const axErr = err && typeof err === 'object' && 'response' in err ? (err as { response?: { data?: { message?: string; Message?: string }; status?: number }; message?: string }) : null
      const res = axErr?.response
      const msg = res?.data?.message ?? res?.data?.Message
      if (res?.status === 401) toast.error(msg || 'Email hoặc mật khẩu không đúng.')
      else if (!res) toast.error('Không kết nối được server. Kiểm tra backend và CORS.')
      else toast.error(typeof msg === 'string' ? msg : 'Đăng nhập thất bại.')
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-hero">
        <div className="auth-hero-slider">
          {heroImages.map((src, i) => (
            <img
              key={i}
              src={src}
              alt="Hà Giang"
              className={`auth-hero-img ${i === currentImage ? 'active' : ''}`}
            />
          ))}
        </div>
        <div className="auth-hero-overlay">
          <h2>CUỘC PHIÊU LƯU<br />TIẾP THEO<br />ĐANG CHỜ BẠN!</h2>
          <p>Đăng nhập để khám phá ưu đãi độc quyền, lên kế hoạch cho chuyến đi mơ ước.</p>
        </div>
        <div className="auth-hero-dots">
          {heroImages.map((_, i) => (
            <button
              key={i}
              type="button"
              className={i === currentImage ? 'active' : ''}
              onClick={() => setCurrentImage(i)}
              aria-label={`Ảnh ${i + 1}`}
            />
          ))}
        </div>
      </section>

      <section className="auth-form-wrap">
        <form className="auth-form" onSubmit={handleLogin}>
          <div className="auth-brand">TravelGo</div>
          <h1 className="auth-title">CHÀO MỪNG TRỞ LẠI!</h1>
          <p className="auth-subtitle">Vui lòng nhập thông tin đăng nhập của bạn.</p>

          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Nhập email của bạn"
            />
          </div>

          <div className="field">
            <label htmlFor="password">Mật khẩu</label>
            <div className="password-row">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mật khẩu"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div className="login-meta">
            <label className="checkbox-wrap" htmlFor="remember">
              <input
                id="remember"
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Ghi nhớ
            </label>
            <button type="button" className="link-btn" onClick={() => navigate('/forgot-password')}>
              Quên mật khẩu
            </button>
          </div>

          <button className="submit-btn" type="submit" disabled={isLoading}>
            {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>

          <p className="switch-auth">
            Chưa có tài khoản?
            <button type="button" onClick={() => navigate('/register')}>
              {' '}
              Đăng ký
            </button>
          </p>
        </form>
      </section>
    </div>
  )
}

export default Login
