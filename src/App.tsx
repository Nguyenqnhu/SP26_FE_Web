import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Login from './pages/Users/login'
import Register from './pages/Users/register'
import VerifyRegisterOtp from './pages/Users/VerifyRegisterOtp'
import ForgotPassword from './pages/Users/ForgotPassword'
import VerifyResetOtp from './pages/Users/VerifyResetOtp'
import ResetPassword from './pages/Users/ResetPassword'
import Preferences from './pages/Users/Preferences'
import Home from './pages/Users/Home'
import Explore from './pages/Users/Explore'
import Trips from './pages/Users/Trips'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-register-otp" element={<VerifyRegisterOtp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-reset-otp" element={<VerifyResetOtp />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/preferences" element={<Preferences />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/trips" element={<Trips />} />
        <Route path="/home" element={<Home />} />
        {/* Trang chủ: navigate('/') từ Preferences phải khớp route này — không thì * đá về /login */}
        <Route path="/" element={<Home />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App