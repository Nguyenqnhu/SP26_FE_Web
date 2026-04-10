import { resolvePoiImageUrl, unwrapApiArray } from './poiImageUrl'

export type Promotion = {
  promotionId: string
  title: string
  description: string
  terms: string
  status: string
  saveCount: number
}

export type AdItem = {
  adId: string
  accountId: string
  packageId: string
  poiId: string
  title: string
  videoUrl: string
  content: string
  imageUrl: string
  startDate: string
  endDate: string
  status: string
  createdAt: string
  promotion: Promotion | null
}

function str(raw: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = raw[k]
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return ''
}

function mapPromotion(pr: Record<string, unknown>): Promotion {
  const sc = pr.saveCount ?? pr.SaveCount
  const saveCount = typeof sc === 'number' && !Number.isNaN(sc) ? sc : Number(sc) || 0
  return {
    promotionId: String(pr.promotionId ?? pr.PromotionId ?? ''),
    title: str(pr, 'title', 'Title'),
    description: str(pr, 'description', 'Description'),
    terms: str(pr, 'terms', 'Terms'),
    status: str(pr, 'status', 'Status') || '—',
    saveCount,
  }
}

export function mapAd(raw: Record<string, unknown>, index: number): AdItem {
  const promoRaw = raw.promotion ?? raw.Promotion
  let promotion: Promotion | null = null
  if (promoRaw && typeof promoRaw === 'object' && !Array.isArray(promoRaw)) {
    promotion = mapPromotion(promoRaw as Record<string, unknown>)
  }

  const imagePath = str(raw, 'imageUrl', 'ImageUrl')
  const videoPath = str(raw, 'videoUrl', 'VideoUrl')

  return {
    adId: String(raw.adId ?? raw.AdId ?? index),
    accountId: String(raw.accountId ?? raw.AccountId ?? ''),
    packageId: String(raw.packageId ?? raw.PackageId ?? ''),
    poiId: String(raw.poiId ?? raw.PoiId ?? ''),
    title: str(raw, 'title', 'Title') || 'Quảng cáo',
    videoUrl: videoPath ? resolvePoiImageUrl(videoPath) : '',
    content: str(raw, 'content', 'Content'),
    imageUrl: imagePath ? resolvePoiImageUrl(imagePath) : '',
    startDate: str(raw, 'startDate', 'StartDate'),
    endDate: str(raw, 'endDate', 'EndDate'),
    status: str(raw, 'status', 'Status') || '—',
    createdAt: str(raw, 'createdAt', 'CreatedAt'),
    promotion,
  }
}

export function parseActiveAdvertisementsResponse(data: unknown): AdItem[] {
  const arr = unwrapApiArray(data)
  return arr.map((item, i) => mapAd(item as Record<string, unknown>, i))
}
