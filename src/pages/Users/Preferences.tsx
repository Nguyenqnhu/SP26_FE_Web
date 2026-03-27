import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { axiosClient } from '../../config/axios'
import { toast } from 'sonner'
import { Search } from 'lucide-react'

import './preferences.css'

type Preference = {
  id: string
  name: string
  icon?: string
}

/** GET user/user-preferences — mỗi phần tử có preferenceId = GUID loại sở thích (dùng để khớp với preferences/get-all) */
type UserPreferenceRow = {
  id?: string
  preferenceId?: string
  preferenceName?: string
}

function parseUserPreferenceIds(userData: unknown): string[] {
  if (!userData) return []
  if (Array.isArray(userData)) {
    if (userData.length === 0) return []
    if (userData.every((x) => typeof x === 'string')) return userData as string[]
    return (userData as UserPreferenceRow[])
      .map((row) => row.preferenceId ?? row.id)
      .filter((x): x is string => typeof x === 'string' && x.length > 0)
  }
  if (typeof userData === 'object') {
    const obj = userData as {
      preferenceIds?: string[]
      data?: string[]
      preferences?: { id?: string; preferenceId?: string }[]
    }
    if (obj.preferenceIds?.length) return obj.preferenceIds
    if (obj.data?.length) return obj.data
    if (obj.preferences?.length) {
      return obj.preferences.map((p) => p.preferenceId ?? p.id).filter(Boolean) as string[]
    }
  }
  return []
}

const Preferences = () => {
  const navigate = useNavigate()
  useEffect(() => {
    if (!localStorage.getItem('accessToken')) navigate('/login', { replace: true })
  }, [navigate])
  const [preferences, setPreferences] = useState<Preference[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const allRes = await axiosClient.get<Preference[] | { items?: Preference[]; data?: Preference[] }>('preferences/get-all')
        const allData = allRes.data
        const list = Array.isArray(allData) ? allData : allData?.items ?? allData?.data ?? []
        setPreferences(list)
        try {
          const userRes = await axiosClient.get<unknown>('user/user-preferences')
          setSelectedIds(new Set(parseUserPreferenceIds(userRes.data)))
        } catch {
          setSelectedIds(new Set())
        }
      } catch (err) {
        console.error('Error fetching preferences:', err)
        toast.error('Không tải được danh sách sở thích.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filtered = useMemo(() => {
    if (!search.trim()) return preferences
    const q = search.toLowerCase().trim()
    return preferences.filter((p) => p.name.toLowerCase().includes(q))
  }, [preferences, search])

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  function extractErrorMessage(err: unknown): string {
    const res = (err as { response?: { data?: unknown } })?.response
    const data = res?.data
    if (data && typeof data === 'object') {
      const o = data as Record<string, unknown>
      if (typeof o.Message === 'string') return o.Message
      if (typeof o.message === 'string') return o.message
      if (typeof o.title === 'string') return o.title
      const errs = o.errors as Record<string, string[]> | undefined
      if (errs) {
        const first = Object.values(errs).flat()[0]
        if (first) return first
      }
    }
    return 'Cập nhật thất bại.'
  }

  const handleContinue = async () => {
    const ids = Array.from(selectedIds).map(String).filter(Boolean)
    try {
      setSubmitting(true)
      // UserPreferencesRequest: PreferenceIds → JSON thường là "preferenceIds"
      await axiosClient.post('user/update-preference', { preferenceIds: ids })
      toast.success('Đã cập nhật sở thích của bạn.')
      navigate('/')
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 400) {
        try {
          await axiosClient.post('user/update-preference', ids)
          toast.success('Đã cập nhật sở thích của bạn.')
          navigate('/')
        } catch (err2) {
          toast.error(extractErrorMessage(err2))
        }
      } else {
        toast.error(extractErrorMessage(err))
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleSkip = () => {
    navigate('/')
  }

  return (
    <div className="preferences-page">
  
      <div className="preferences-content">
        <header className="preferences-header">
          <h1 className="preferences-title">Bạn thích loại du lịch nào?</h1>
          <p className="preferences-desc">
            Chọn danh mục phù hợp với sở thích của bạn. Điều này giúp chúng tôi cá nhân hóa trải nghiệm.
          </p>
        </header>

        <div className="preferences-search">
          <Search className="preferences-search-icon" size={20} />
          <input
            type="text"
            placeholder="Tìm danh mục"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="preferences-search-input"
          />
        </div>

        <div className="preferences-grid">
          {loading ? (
            <p className="preferences-loading">Đang tải...</p>
          ) : (
            filtered.map((p) => {
              const isSelected = selectedIds.has(p.id)
              return (
                <button
                  key={p.id}
                  type="button"
                  className={`preferences-tag ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggle(p.id)}
                >
                  {p.name}
                </button>
              )
            })
          )}
        </div>

        <footer className="preferences-footer">
          <button className="preferences-btn-primary" onClick={handleContinue} disabled={submitting}>
            {submitting ? 'Đang lưu...' : 'Tiếp tục'}
          </button>
          <button type="button" className="preferences-btn-skip" onClick={handleSkip}>
            Bỏ qua
          </button>
        </footer>
      </div>
    </div>
  )
}

export default Preferences
