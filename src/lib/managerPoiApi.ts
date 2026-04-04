import { axiosClient } from '../config/axios'

/** Query bắt buộc theo Swagger: POST manager/pois?locationId=&districtId= */
export type CreateManagerPoiQuery = {
  locationId: string
  districtId: string
}

/**
 * Body khớp DTO BE (PascalCase). OpenHour/CloseHour: dạng thời gian (vd. 09:00:00).
 * PoiPreferences: mảng id (GUID) — luôn gửi mảng (kể cả rỗng) để tránh null trên BE.
 */
export type CreateManagerPoiBody = {
  Name: string
  Address: string
  City: string
  ApproxCost: string
  OpenHour: string
  CloseHour: string
  LocationId: string
  DistrictId: string
  GoogleMapLink: string
  VisitRecommendation?: string
  IsIndoor: boolean
  Type: string
  PoiPreferences: string[]
  /** Chỉ dùng khi gửi JSON (không file); nếu có file thì dùng tham số imageFile */
  POIImgUrl?: string
}

function normalizeTimeForApi(v: string): string {
  const t = v.trim()
  if (!t) return '00:00:00'
  if (/^\d{1,2}:\d{2}$/.test(t)) return `${t}:00`
  return t
}

function appendFormFields(fd: FormData, body: CreateManagerPoiBody) {
  fd.append('Name', body.Name)
  fd.append('Address', body.Address)
  fd.append('City', body.City)
  fd.append('ApproxCost', body.ApproxCost)
  fd.append('OpenHour', normalizeTimeForApi(body.OpenHour))
  fd.append('CloseHour', normalizeTimeForApi(body.CloseHour))
  fd.append('LocationId', body.LocationId)
  fd.append('DistrictId', body.DistrictId)
  fd.append('GoogleMapLink', body.GoogleMapLink)
  if (body.VisitRecommendation != null && body.VisitRecommendation !== '') {
    fd.append('VisitRecommendation', body.VisitRecommendation)
  }
  fd.append('IsIndoor', body.IsIndoor ? 'true' : 'false')
  fd.append('Type', body.Type)
  body.PoiPreferences.forEach((id, i) => {
    fd.append(`PoiPreferences[${i}]`, id)
  })
}

/**
 * POST `manager/pois` — có ảnh file thì gửi multipart (POIImgUrl = file theo Swagger string/binary).
 * Không ảnh: JSON; có thể gửi POIImgUrl là chuỗi URL nếu BE cho phép.
 */
export async function createManagerPoi(
  query: CreateManagerPoiQuery,
  body: CreateManagerPoiBody,
  imageFile?: File | null,
) {
  const params = {
    locationId: query.locationId.trim(),
    districtId: query.districtId.trim(),
  }

  const open = normalizeTimeForApi(body.OpenHour)
  const close = normalizeTimeForApi(body.CloseHour)
  const normalizedBody: CreateManagerPoiBody = {
    ...body,
    OpenHour: open,
    CloseHour: close,
    PoiPreferences: Array.isArray(body.PoiPreferences) ? body.PoiPreferences : [],
  }

  if (imageFile && imageFile.size > 0) {
    const fd = new FormData()
    appendFormFields(fd, normalizedBody)
    fd.append('POIImgUrl', imageFile, imageFile.name)
    return axiosClient.post<unknown>('manager/pois', fd, { params })
  }

  const json: Record<string, unknown> = {
    Name: normalizedBody.Name,
    Address: normalizedBody.Address,
    City: normalizedBody.City,
    ApproxCost: normalizedBody.ApproxCost,
    OpenHour: normalizedBody.OpenHour,
    CloseHour: normalizedBody.CloseHour,
    LocationId: normalizedBody.LocationId,
    DistrictId: normalizedBody.DistrictId,
    GoogleMapLink: normalizedBody.GoogleMapLink,
    IsIndoor: normalizedBody.IsIndoor,
    Type: normalizedBody.Type,
    PoiPreferences: normalizedBody.PoiPreferences,
  }
  if (normalizedBody.VisitRecommendation != null && normalizedBody.VisitRecommendation !== '') {
    json.VisitRecommendation = normalizedBody.VisitRecommendation
  }
  if (normalizedBody.POIImgUrl != null && normalizedBody.POIImgUrl.trim() !== '') {
    json.POIImgUrl = normalizedBody.POIImgUrl.trim()
  }

  return axiosClient.post<unknown>('manager/pois', json, { params })
}
