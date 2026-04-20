'use client'
import { useEffect, useRef, useState } from 'react'
import { supabase } from './../app/lib/supabase'

export default function NewsTicker() {
  const [items, setItems] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const trackRef = useRef<HTMLDivElement>(null)
  const posRef = useRef(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('news')
        .select('content')
        .order('news_date', { ascending: false })
      if (data && data.length > 0) {
        setItems(data.map((r: any) => r.content as string))
      }
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    const track = trackRef.current
    if (!track || items.length === 0) return

    const SPEED = 0.5

    const half = track.scrollWidth / 2
    posRef.current = 0

    const animate = () => {
      posRef.current += SPEED
      if (posRef.current >= half) {
        posRef.current = 0
      }
      track.style.transform = `translateX(${posRef.current}px)`
      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current!)
  }, [items])

  const containerStyle = {
    height: '36px',
    fontFamily: "'Cairo', sans-serif",
  }

  // Skeleton — نفس الارتفاع والألوان، يظهر فوراً
  if (loading) {
    return (
      <div
        dir="rtl"
        className="w-full flex items-center overflow-hidden bg-[#1a1a2e] border-t-2 border-b-2 border-red-600"
        style={containerStyle}
      >
        <div className="flex-shrink-0 bg-red-600 text-white text-[13px] font-bold px-4 h-full flex items-center whitespace-nowrap">
          أخبار الجمعية
        </div>
        <div className="flex-1 h-full flex items-center px-6">
          <div className="h-2 w-48 rounded-full bg-white opacity-10 animate-pulse" />
        </div>
      </div>
    )
  }

  if (items.length === 0) return null

  const doubled = [...items, ...items]

  return (
    <div
      dir="rtl"
      className="w-full flex items-center overflow-hidden bg-[#1a1a2e] border-t-2 border-b-2 border-red-600"
      style={containerStyle}
    >
      <div className="flex-shrink-0 bg-red-600 text-white text-[13px] font-bold px-4 h-full flex items-center whitespace-nowrap z-10">
       أخبار الجمعية
      </div>

      <div className="flex-1 overflow-hidden">
        <div
          ref={trackRef}
          className="flex whitespace-nowrap"
          style={{ willChange: 'transform' }}
        >
          {doubled.map((text, i) => (
            <span
              key={i}
              className="inline-flex items-center text-white text-[13px] px-6 gap-4"
            >
              {text}
              <span className="text-red-400 text-[10px]">❖</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}