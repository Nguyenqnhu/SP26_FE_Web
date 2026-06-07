// src/lib/axios.ts
import axios from 'axios';

// 1. Tạo instance (bản sao) của axios với cấu hình mặc định
// Dev: dùng '/api' để Vite proxy chuyển tiếp (tránh CORS). Prod: dùng URL backend đầy đủ.
const baseURL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? '/api' : '')

export const axiosClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Backend có thể trả `token` kèm tiền tố "Bearer " — chỉ lưu phần JWT,
 * vì axios sẽ gắn `Authorization: Bearer <jwt>`.
 */
export function normalizeStoredToken(raw: string): string {
  let t = raw.replace(/^["']|["']$/g, '').trim()
  if (/^Bearer\s+/i.test(t)) {
    t = t.replace(/^Bearer\s+/i, '').trim()
  }
  return t
}

export function getAccessToken(): string | null {
  const raw = localStorage.getItem('accessToken')
  if (!raw) return null
  const t = normalizeStoredToken(raw)
  return t || null
}

// 2. Cấu hình Interceptor (Bộ đón lõng)
// Tác dụng: Tự động gắn Token vào mọi request gửi đi (nếu có đăng nhập)
axiosClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  /* FormData: bỏ Content-Type mặc định application/json để trình duyệt gắn boundary multipart */
  if (config.data instanceof FormData) {
    const h = config.headers
    if (h && typeof (h as { delete?: (k: string) => void }).delete === 'function') {
      ;(h as { delete: (k: string) => void }).delete('Content-Type')
    }
  }
  return config;
});

// 3. Xử lý lỗi chung (Optional)
// Không redirect 401 cho các API có thể trả 401 nhưng user vẫn cần ở lại trang (hiện toast)
const SKIP_401_REDIRECT = [
  'auth/login',
  'preferences/get-all',
  'user/user-preferences',
  'user/update-preference',
  'pois/recommended',
];
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url ?? '';
    const skipRedirect = SKIP_401_REDIRECT.some((p) => url.includes(p));
    if (error.response?.status === 401 && !skipRedirect) {
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);