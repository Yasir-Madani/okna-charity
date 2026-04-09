'use client'
import { useEffect, useRef, useState } from 'react'
import { supabase } from './../app/lib/supabase'

export default function NewsTicker() {
  const [items, setItems] = useState<string[]>([])
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('news')
        .select('content')
        .order('news_date', { ascending: false })
      if (data && data.length > 0) {
        setItems(data.map((r: any) => r.content as string))
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (!trackRef.current || items.length === 0) return
    const SPEED = 80
    const half = trackRef.current.scrollWidth / 2
    const dur = half / SPEED
    trackRef.current.style.animationDuration = `${dur}s`
  }, [items])

  if (items.length === 0) return null

  const doubled = [...items, ...items]

  return (
    <div
      dir="rtl"
      className="w-full flex items-center overflow-hidden bg-[#1a1a2e] border-t-2 border-b-2 border-red-600"
      style={{ height: '36px', fontFamily: "'Cairo', sans-serif" }}
    >
      <div className="flex-shrink-0 bg-red-600 text-white text-[13px] font-bold px-4 h-full flex items-center whitespace-nowrap z-10">
        📰 أخبار
      </div>

      <div className="flex-1 overflow-hidden">
        <div
          ref={trackRef}
          className="flex whitespace-nowrap"
          style={{
            animation: 'ticker-rtl 60s linear infinite',
            willChange: 'transform',
          }}
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

      <style>{`
        @keyframes ticker-rtl {
          0%   { transform: translateX(-50%); }
          100% { transform: translateX(0%); }
        }
      `}</style>
    </div>
  )
}