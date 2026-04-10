import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { ChevronDown, Heart, LogOut, Menu, Search, User, X } from 'lucide-react'
import './AppNavbar.css'

function readAuth() {
  return {
    token: localStorage.getItem('accessToken'),
    email: localStorage.getItem('userEmail') ?? '',
    name: localStorage.getItem('userDisplayName') ?? '',
  }
}

export function AppNavbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const [auth, setAuth] = useState(readAuth)
  const accountRef = useRef<HTMLDivElement>(null)

  const syncAuth = useCallback(() => setAuth(readAuth()), [])

  useEffect(() => {
    const onAuth = () => syncAuth()
    window.addEventListener('travelgo-auth', onAuth)
    return () => window.removeEventListener('travelgo-auth', onAuth)
  }, [syncAuth])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) setAccountOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const displayName = auth.name || auth.email || 'Bạn'
  const initial = (displayName[0] || 'U').toUpperCase()

  const handleLogout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('userEmail')
    localStorage.removeItem('userDisplayName')
    syncAuth()
    setAccountOpen(false)
    setMobileOpen(false)
    window.dispatchEvent(new Event('travelgo-auth'))
    navigate('/login', { replace: true })
  }

  const goFeatured = () => {
    const path = location.pathname
    if (path === '/' || path === '/home') {
      document.getElementById('featured')?.scrollIntoView({ behavior: 'smooth' })
    } else {
      navigate({ pathname: '/', hash: 'featured' })
    }
  }

  const onSearchSubmit = (e: FormEvent) => {
    e.preventDefault()
    setMobileOpen(false)
    goFeatured()
  }

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `app-nav__link${isActive ? ' app-nav__link--active' : ''}`

  return (
    <header className="app-nav">
      <div className="app-nav__inner">
        <Link to="/" className="app-nav__brand" onClick={() => setMobileOpen(false)}>
          <span className="app-nav__brand-mark" aria-hidden />
          TravelGo
        </Link>

        <nav className="app-nav__links" aria-label="Menu chính">
          <NavLink to="/" end className={navClass}>
            Trang chủ
          </NavLink>
          <NavLink to="/explore" className={navClass}>
            Khám phá
          </NavLink>
          <NavLink to="/trips" className={navClass}>
            Chuyến đi
          </NavLink>
           <NavLink to="/advertisement" className={navClass}>
            Quảng cáo
          </NavLink>
        </nav>

        <form className="app-nav__search" onSubmit={onSearchSubmit} role="search">
          <Search size={18} className="app-nav__search-icon" aria-hidden />
          <input
            type="search"
            name="q"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Tìm địa điểm..."
            className="app-nav__search-input"
            aria-label="Tìm địa điểm"
          />
        </form>

        <div className="app-nav__right">
          {auth.token ? (
            <div className="app-nav__account-wrap" ref={accountRef}>
              <button
                type="button"
                className="app-nav__account-btn"
                aria-expanded={accountOpen}
                aria-haspopup="menu"
                onClick={() => setAccountOpen((o) => !o)}
              >
                <span className="app-nav__avatar" aria-hidden>
                  {initial}
                </span>
                <span className="app-nav__account-label">{displayName}</span>
                <ChevronDown size={18} className={accountOpen ? 'app-nav__chev--open' : ''} />
              </button>
              {accountOpen && (
                <div className="app-nav__dropdown" role="menu">
                  <div className="app-nav__dropdown-head">
                    <User size={18} />
                    <div>
                      <div className="app-nav__dropdown-title">Tài khoản</div>
                      {auth.email ? <div className="app-nav__dropdown-email">{auth.email}</div> : null}
                    </div>
                  </div>
                  <button type="button" role="menuitem" className="app-nav__dropdown-item" onClick={() => { navigate('/preferences'); setAccountOpen(false); setMobileOpen(false) }}>
                    <Heart size={18} />
                    Sở thích du lịch
                  </button>
                  <button type="button" role="menuitem" className="app-nav__dropdown-item app-nav__dropdown-item--danger" onClick={handleLogout}>
                    <LogOut size={18} />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="app-nav__pill">
              Tài khoản
            </Link>
          )}

          <button
            type="button"
            className="app-nav__burger"
            aria-label={mobileOpen ? 'Đóng menu' : 'Mở menu'}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="app-nav__mobile" id="mobile-nav">
          <form className="app-nav__search app-nav__search--mobile" onSubmit={onSearchSubmit}>
            <Search size={18} className="app-nav__search-icon" aria-hidden />
            <input
              type="search"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Tìm địa điểm..."
              className="app-nav__search-input"
              aria-label="Tìm địa điểm"
            />
          </form>
          <NavLink to="/" end className={navClass} onClick={() => setMobileOpen(false)}>
            Trang chủ
          </NavLink>
          <NavLink to="/explore" className={navClass} onClick={() => setMobileOpen(false)}>
            Khám phá
          </NavLink>
          <NavLink to="/trips" className={navClass} onClick={() => setMobileOpen(false)}>
            Chuyến đi
          </NavLink>
          <NavLink to="/advertisement" className={navClass} onClick={() => setMobileOpen(false)}>
            Quảng cáo
          </NavLink>
          {!auth.token && (
            <Link to="/login" className="app-nav__mobile-login" onClick={() => setMobileOpen(false)}>
              Tài khoản
            </Link>
          )}
          {auth.token && (
            <>
              <button type="button" className="app-nav__mobile-item" onClick={() => { navigate('/preferences'); setMobileOpen(false) }}>
                Sở thích du lịch
              </button>
              <button type="button" className="app-nav__mobile-item app-nav__mobile-item--danger" onClick={handleLogout}>
                Đăng xuất
              </button>
            </>
          )}
        </div>
      )}
    </header>
  )
}
