import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { axiosClient } from '../../config/axios'
import { toast } from 'sonner'
import hagiang1 from '../../assets/hagiang.png'
import hagiang2 from '../../assets/hagiang2.png'
import './auth.css'

const heroImages = [hagiang1, hagiang2]

const Register = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [gender, setGender] = useState('Male')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentImage, setCurrentImage] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % heroImages.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const isInvalid = useMemo(
    () =>
      !email.trim() ||
      !password.trim() ||
      !dateOfBirth ||
      !name.trim() ||
      !address.trim() ||
      !phoneNumber.trim() ||
      !gender.trim(),
    [address, dateOfBirth, email, gender, name, password, phoneNumber],
  )

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (isInvalid) {
      toast.error('Vui lòng điền đầy đủ thông tin.')
      return
    }

    try {
      setIsLoading(true)
      await axiosClient.post('auth/register', {
        email: email.trim(),
        password,
        dateOfBirth: new Date(dateOfBirth).toISOString(),
        name: name.trim(),
        address: address.trim(),
        phoneNumber: phoneNumber.trim(),
        gender,
      })
      toast.success('Đã gửi OTP về email của bạn.')
      navigate('/verify-register-otp', { state: { email: email.trim() } })
    } catch (err: unknown) {
      const res = err && typeof err === 'object' && 'response' in err ? (err as { response?: { data?: { message?: string }; status?: number } }).response : null
      const msg = res?.data?.message
      toast.error(typeof msg === 'string' ? msg : 'Đăng ký thất bại.')
    } finally {
      setIsLoading(false)
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
        <form className="auth-form" onSubmit={handleRegister}>
          <div className="auth-brand">TravelGo</div>
          <h1 className="auth-title">TẠO TÀI KHOẢN</h1>
          <p className="auth-subtitle">Nhập thông tin của bạn để bắt đầu</p>

          <div className="field">
            <label htmlFor="name">Họ và tên</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập họ và tên"
            />
          </div>

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

          <div className="field">
            <label htmlFor="dob">Ngày sinh</label>
            <input id="dob" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
          </div>

          <div className="field">
            <label htmlFor="address">Địa chỉ</label>
            <input
              id="address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Nhập địa chỉ"
            />
          </div>

          <div className="field">
            <label htmlFor="phoneNumber">Số điện thoại</label>
            <input
              id="phoneNumber"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Nhập số điện thoại"
            />
          </div>

          <div className="field">
            <label htmlFor="gender">Giới tính</label>
            <select id="gender" value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <button className="submit-btn" type="submit" disabled={isLoading}>
            {isLoading ? 'Đang đăng ký...' : 'Đăng ký'}
          </button>

          <p className="switch-auth">
            Đã có tài khoản?
            <button type="button" onClick={() => navigate('/login')}>
              {' '}
              Đăng nhập
            </button>
          </p>
        </form>
      </section>
    </div>
  )
}

export default Register
