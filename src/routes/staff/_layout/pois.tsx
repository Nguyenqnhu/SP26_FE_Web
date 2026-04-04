import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { axiosClient } from '../../../config/axios'
import { createStaffPOI, type CreateManagerPoiBody } from '../../../services/poiService'
import { unwrapApiArray } from '../../../lib/poiImageUrl'
import './staff-pois.css'

/** Chuẩn hóa <input type="time"> (HH:mm) → HH:mm:ss cho API */
function timeInputToApi(s: string): string {
  const t = s.trim()
  if (!t) return '00:00:00'
  return t.length === 5 ? `${t}:00` : t
}

type LocationOption = { id: string; name: string }
type DistrictOption = { id: string; name: string; locationId: string | undefined }

function pickTrimString(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined
  const t = v.trim()
  return t ? t : undefined
}

function pickAnyId(row: Record<string, unknown>): string | undefined {
  return (
    pickTrimString(row.id) ??
    pickTrimString(row.Id) ??
    pickTrimString(row.locationId) ??
    pickTrimString(row.LocationId) ??
    pickTrimString(row.districtId) ??
    pickTrimString(row.DistrictId) ??
    pickTrimString((row.Location as any)?.Id) ??
    pickTrimString((row.District as any)?.Id)
  )
}

function pickAnyName(row: Record<string, unknown>): string | undefined {
  return (
    pickTrimString(row.name) ??
    pickTrimString(row.Name) ??
    pickTrimString(row.locationName) ??
    pickTrimString(row.LocationName) ??
    pickTrimString(row.districtName) ??
    pickTrimString(row.DistrictName)
  )
}

function pickLocationIdFromRow(row: Record<string, unknown>): string | undefined {
  return pickTrimString(row.locationId) ?? pickTrimString(row.LocationId) ?? pickTrimString((row.Location as any)?.Id)
}

const emptyForm = (): CreateManagerPoiBody & {
  locationIdQ: string
  districtIdQ: string
} => ({
  locationIdQ: '',
  districtIdQ: '',
  Name: '',
  Address: '',
  City: '',
  ApproxCost: '',
  OpenHour: '09:00',
  CloseHour: '18:00',
  LocationId: '',
  DistrictId: '',
  GoogleMapLink: '',
  VisitRecommendation: '',
  IsIndoor: false,
  Type: '',
  PoiPreferences: [],
  POIImgUrl: '',
})

/**
 * Trang quản trị tạo POI — payload khớp Swagger POST manager/pois
 * (query locationId, districtId + body PascalCase; ảnh file → multipart).
 */
export default function StaffPoisPage() {
  const navigate = useNavigate()
  useEffect(() => {
    if (!localStorage.getItem('accessToken')) navigate('/login', { replace: true })
  }, [navigate])
  const [locations, setLocations] = useState<LocationOption[]>([])
  const [districts, setDistricts] = useState<DistrictOption[]>([])

  useEffect(() => {
    const loadLocationsAndDistricts = async () => {
      const locationPaths = ['locations/get-all', 'location/get-all', 'locations', 'location']
      let didLoadLocations = false
      for (const path of locationPaths) {
        try {
          const { data } = await axiosClient.get<unknown>(path)
          const arr = unwrapApiArray(data) as Record<string, unknown>[]
          const list: LocationOption[] = arr
            .map((r) => {
              const id = pickAnyId(r)
              const name = pickAnyName(r)
              return id && name ? { id, name } : null
            })
            .filter((x): x is LocationOption => !!x)
          if (list.length) {
            setLocations(list)
            didLoadLocations = true
            break
          }
        } catch {
          // try next candidate
        }
      }

      const districtPaths = ['districts/get-all', 'district/get-all', 'districts', 'district']
      let didLoadDistricts = false
      for (const path of districtPaths) {
        try {
          const { data } = await axiosClient.get<unknown>(path)
          const arr = unwrapApiArray(data) as Record<string, unknown>[]
          const list: DistrictOption[] = arr
            .map((r) => {
              const id = pickAnyId(r)
              const name = pickAnyName(r)
              const locationId = pickLocationIdFromRow(r)
              return id && name ? { id, name, locationId } : null
            })
            .filter((x): x is DistrictOption => !!x)
          if (list.length) {
            setDistricts(list)
            didLoadDistricts = true
            break
          }
        } catch {
          // try next candidate
        }
      }

      if (!didLoadLocations) toast.error('Không tải được danh sách locationName.')
      if (!didLoadDistricts) toast.error('Không tải được danh sách districtName.')
    }

    loadLocationsAndDistricts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [prefInput, setPrefInput] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)

  const filteredDistricts = districts.filter((d) => {
    if (!form.locationIdQ) return true
    if (!d.locationId) return true
    return d.locationId === form.locationIdQ
  })

  const update = useCallback(<K extends keyof ReturnType<typeof emptyForm>>(key: K, v: ReturnType<typeof emptyForm>[K]) => {
    setForm((f) => ({ ...f, [key]: v }))
  }, [])

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const locationId = form.locationIdQ.trim()
    const districtId = form.districtIdQ.trim()
    if (!locationId || !districtId) {
      toast.error('Cần chọn locationName và districtName.')
      return
    }
    if (!form.Name.trim() || !form.Address.trim() || !form.City.trim()) {
      toast.error('Cần Name, Address, City.')
      return
    }

    const body: CreateManagerPoiBody = {
      Name: form.Name.trim(),
      Address: form.Address.trim(),
      City: form.City.trim(),
      ApproxCost: form.ApproxCost.trim() || '0',
      OpenHour: timeInputToApi(form.OpenHour),
      CloseHour: timeInputToApi(form.CloseHour),
      LocationId: locationId,
      DistrictId: districtId,
      GoogleMapLink: form.GoogleMapLink.trim() || 'https://maps.google.com',
      VisitRecommendation: form.VisitRecommendation?.trim() || undefined,
      IsIndoor: form.IsIndoor,
      Type: form.Type.trim() || 'General',
      PoiPreferences: form.PoiPreferences,
      POIImgUrl: form.POIImgUrl?.trim() || undefined,
    }

    setSubmitting(true)
    try {
      await createStaffPOI(
        { locationId, districtId },
        body,
        imageFile && imageFile.size > 0 ? imageFile : null,
      )
      toast.success('Đã tạo POI.')
      setForm(emptyForm())
      setPrefInput('')
      setImageFile(null)
    } catch (err: unknown) {
      console.error(err)
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined
      toast.error(typeof msg === 'string' ? msg : 'Tạo POI thất bại (400/500).')
    } finally {
      setSubmitting(false)
    }
  }

  const addPref = () => {
    const id = prefInput.trim()
    if (!id) return
    setForm((f) => ({ ...f, PoiPreferences: [...f.PoiPreferences, id] }))
    setPrefInput('')
  }

  const removePref = (idx: number) => {
    setForm((f) => ({
      ...f,
      PoiPreferences: f.PoiPreferences.filter((_, i) => i !== idx),
    }))
  }

  return (
    <div className="staff-pois">
      <header className="staff-pois__head">
        <h1>Tạo POI (manager)</h1>
        <button type="button" className="staff-pois__link" onClick={() => navigate('/home')}>
          Về trang chủ
        </button>
      </header>

      <form className="staff-pois__form" onSubmit={handleCreateSubmit}>
        <fieldset>
          <legend>Query (bắt buộc)</legend>
          <label>
            locationName
            <select
              value={form.locationIdQ}
              onChange={(e) => {
                const nextLocationId = e.target.value
                setForm((f) => ({
                  ...f,
                  locationIdQ: nextLocationId,
                  LocationId: nextLocationId,
                  districtIdQ: '',
                  DistrictId: '',
                }))
              }}
            >
              <option value="">Chọn locationName</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            districtName
            <select
              value={form.districtIdQ}
              onChange={(e) => {
                const nextDistrictId = e.target.value
                setForm((f) => ({
                  ...f,
                  districtIdQ: nextDistrictId,
                  DistrictId: nextDistrictId,
                }))
              }}
              disabled={!form.locationIdQ || !filteredDistricts.length}
            >
              <option value="">Chọn districtName</option>
              {filteredDistricts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
        </fieldset>

        <fieldset>
          <legend>Body (PascalCase → JSON / form)</legend>
          <label>
            Name
            <input value={form.Name} onChange={(e) => update('Name', e.target.value)} required />
          </label>
          <label>
            Address
            <input value={form.Address} onChange={(e) => update('Address', e.target.value)} required />
          </label>
          <label>
            City
            <input value={form.City} onChange={(e) => update('City', e.target.value)} required />
          </label>
          <label>
            ApproxCost
            <input value={form.ApproxCost} onChange={(e) => update('ApproxCost', e.target.value)} />
          </label>
          <div className="staff-pois__row">
            <label>
              OpenHour
              <input type="time" value={form.OpenHour} onChange={(e) => update('OpenHour', e.target.value)} />
            </label>
            <label>
              CloseHour
              <input type="time" value={form.CloseHour} onChange={(e) => update('CloseHour', e.target.value)} />
            </label>
          </div>
          <label>
            LocationId (tự động từ locationName)
            <input value={form.LocationId} disabled />
          </label>
          <label>
            DistrictId (tự động từ districtName)
            <input value={form.DistrictId} disabled />
          </label>
          <label>
            GoogleMapLink
            <input value={form.GoogleMapLink} onChange={(e) => update('GoogleMapLink', e.target.value)} />
          </label>
          <label>
            VisitRecommendation
            <textarea
              value={form.VisitRecommendation}
              onChange={(e) => update('VisitRecommendation', e.target.value)}
              rows={2}
            />
          </label>
          <label className="staff-pois__check">
            <input
              type="checkbox"
              checked={form.IsIndoor}
              onChange={(e) => update('IsIndoor', e.target.checked)}
            />
            IsIndoor
          </label>
          <label>
            Type
            <input value={form.Type} onChange={(e) => update('Type', e.target.value)} />
          </label>
        </fieldset>

        <fieldset>
          <legend>PoiPreferences (GUID, thêm từng dòng)</legend>
          <div className="staff-pois__pref-row">
            <input
              value={prefInput}
              onChange={(e) => setPrefInput(e.target.value)}
              placeholder="preference-id-uuid"
            />
            <button type="button" onClick={addPref}>
              Thêm
            </button>
          </div>
          <ul className="staff-pois__pref-list">
            {form.PoiPreferences.map((id, idx) => (
              <li key={`${id}-${idx}`}>
                <code>{id}</code>
                <button type="button" onClick={() => removePref(idx)}>
                  Xóa
                </button>
              </li>
            ))}
          </ul>
        </fieldset>

        <fieldset>
          <legend>Ảnh (POIImgUrl)</legend>
          <label>
            File ảnh (multipart — ưu tiên)
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <label>
            Hoặc URL chuỗi (khi không chọn file)
            <input
              value={form.POIImgUrl}
              onChange={(e) => update('POIImgUrl', e.target.value)}
              placeholder="https://..."
              disabled={!!(imageFile && imageFile.size > 0)}
            />
          </label>
        </fieldset>

        <button type="submit" className="staff-pois__submit" disabled={submitting}>
          {submitting ? 'Đang gửi…' : 'Tạo POI'}
        </button>
      </form>
    </div>
  )
}
