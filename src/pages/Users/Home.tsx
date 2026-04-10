import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { axiosClient } from '../../config/axios'
import { pickPoiImageUrl, unwrapApiArray } from '../../lib/poiImageUrl'
import { Brain, Map, Share2, CloudSun } from 'lucide-react'
import anh1 from '../../assets/anh1.png'
import anh2 from '../../assets/anh2.png'
import { AppFooter, AppNavbar } from '../../components/layout'
import {
  HomeAboutFeature,
  HomeAdsRail,
  HomeHero,
  HomePoiGrid,
  HomeWhySection,
} from '../../components/home'
import '../../components/home/home-luxury.css'

const HERO_IMAGES = [anh1, anh2]

const WHY_ITEMS = [
  {
    icon: Brain,
    title: 'AI thông minh',
    desc: 'Gợi ý lịch trình bằng tiếng Việt, tối ưu theo gu và ngân sách — bạn chỉ cần nói điều mình muốn.',
  },
  {
    icon: Map,
    title: 'Bản đồ trực quan',
    desc: 'Nhìn một cái là thấy cả hành trình: từ chợ quê đến đèo núi, dễ chỉnh tay trên bản đồ.',
  },
  {
    icon: Share2,
    title: 'Chia sẻ dễ dàng',
    desc: 'Gửi link hoặc ảnh đẹp cho anh chị em, cả nhà cùng xem chuyến đi.',
  },
  {
    icon: CloudSun,
    title: 'Thời tiết & mùa đẹp',
    desc: 'Gợi ý theo mùa mưa nắng để khỏi dính mưa phùn hay nắng gắt bất ngờ.',
  },
] as const

const Home = () => {
  const navigate = useNavigate()
  const [poiList, setPoiList] = useState<
    {
      id: string
      name: string
      description?: string
      imageUrl?: string
      city?: string
      address?: string
    }[]
  >([])
  const [poiLoading, setPoiLoading] = useState(true)
  const [heroSlide, setHeroSlide] = useState(0)

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) navigate('/login', { replace: true })
  }, [navigate])

  useEffect(() => {
    const id = window.location.hash.replace(/^#/, '')
    if (!id) return
    const t = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    }, 150)
    return () => window.clearTimeout(t)
  }, [])

  useEffect(() => {
    const t = setInterval(() => {
      setHeroSlide((s) => (s + 1) % HERO_IMAGES.length)
    }, 6000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await axiosClient.get<unknown>('pois/recommended')
        const arr = unwrapApiArray(data)
        const list = arr.map((p, i) => {
          const x = p as Record<string, unknown>
          return {
            id: String(x.id ?? i),
            name: String(x.name ?? 'Địa điểm'),
            description: x.description as string | undefined,
            imageUrl: pickPoiImageUrl(x),
            city: x.city as string | undefined,
            address: x.address as string | undefined,
          }
        })
        setPoiList(list)
      } catch {
        setPoiList([])
      } finally {
        setPoiLoading(false)
      }
    }
    load()
  }, [])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="hl-page">
      <AppNavbar />

      <HomeHero
        images={HERO_IMAGES}
        activeIndex={heroSlide}
        onDotClick={setHeroSlide}
        onExplore={() => scrollTo('featured')}
        onAbout={() => scrollTo('about')}
      />

      <HomeAboutFeature imgPortrait={anh1} imgWide={anh2} />

      <HomePoiGrid pois={poiList} loading={poiLoading} />

      <HomeAdsRail />

      <HomeWhySection items={WHY_ITEMS} />

      <AppFooter />
    </div>
  )
}

export default Home
