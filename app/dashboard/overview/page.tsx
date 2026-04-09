'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function OverviewPage() {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAndFetch = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      fetchData()
    }
    checkAndFetch()
  }, [])

  const fetchData = async () => {
    const { data } = await supabase
      .from('houses')
      .select(`
        id,
        house_number,
        name,
        sector,
        families (
          id,
          name,
          individuals (id)
        )
      `)
      .order('house_number', { ascending: true })

    if (data) {
      const expanded: any[] = []
      data.forEach((house: any) => {
        if (house.families && house.families.length > 0) {
          house.families.forEach((family: any) => {
            expanded.push({
              house_number: house.house_number || '—',
              house_name: house.name,
              family_name: family.name,
              sector: house.sector,
              individual_count: family.individuals?.length || 0,
            })
          })
        } else {
          expanded.push({
            house_number: house.house_number || '—',
            house_name: house.name,
            family_name: '—',
            sector: house.sector,
            individual_count: 0,
          })
        }
      })
      setRows(expanded)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">

      {/* شريط العنوان */}
      <div className="bg-green-700 text-white px-4 py-3 flex justify-between items-center sticky top-0 z-20 shadow-md">
        <h1 className="text-base font-bold">نظرة عامة — المنازل والأسر</h1>
        <button
          onClick={() => router.push('/dashboard')}
          className="bg-white text-green-700 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
        >
          ← الرئيسية
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-3 py-4">

        {loading ? (
          <p className="text-center text-gray-400 text-sm py-16">جاري التحميل...</p>
        ) : rows.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-16">لا توجد بيانات</p>
        ) : (
          <>
            {/* 🔥 البطاقات للموبايل */}
            <div className="md:hidden space-y-4">
              {rows.map((row, index) => (
                <div
                  key={index}
                  className="relative bg-white rounded-2xl shadow-lg border border-gray-100 p-4 overflow-hidden"
                >
                  {/* لمسة جمالية */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-green-700"></div>

                  {/* رقم المنزل */}
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs text-gray-400">رقم المنزل</span>
                    <span className="text-sm font-bold text-green-700">
                      {row.house_number}
                    </span>
                  </div>

                  {/* اسم المنزل */}
                  <div className="mb-2">
                    <p className="text-xs text-gray-400">اسم المنزل</p>
                    <p className="text-sm font-semibold text-gray-800 leading-snug">
                      {row.house_name}
                    </p>
                  </div>

                  {/* اسم الأسرة */}
                  <div className="mb-3">
                    <p className="text-xs text-gray-400">اسم الأسرة</p>
                    <p className="text-sm text-gray-700 leading-snug">
                      {row.family_name}
                    </p>
                  </div>

                  {/* أسفل البطاقة */}
                  <div className="flex justify-between items-center pt-3 border-t border-gray-100">

                    {/* المحور */}
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                      {row.sector}
                    </span>

                    {/* عدد الأفراد */}
                    <div className="text-right">
                      <p className="text-[10px] text-gray-400">عدد الأفراد</p>
                      <p className="text-base font-bold text-purple-600">
                        {row.individual_count}
                      </p>
                    </div>

                  </div>
                </div>
              ))}
            </div>

            {/* ✅ الجدول كما هو (للديسكتوب فقط) */}
            <div className="hidden md:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

              <div className="grid grid-cols-5 bg-green-700 text-white text-xs font-bold text-center">
                <div className="px-2 py-3 border-l border-green-600">رقم المنزل</div>
                <div className="px-2 py-3 border-l border-green-600">اسم المنزل</div>
                <div className="px-2 py-3 border-l border-green-600">اسم الأسرة</div>
                <div className="px-2 py-3 border-l border-green-600">المحور</div>
                <div className="px-2 py-3">عدد الأفراد</div>
              </div>

              {rows.map((row, index) => (
                <div
                  key={index}
                  className={`grid grid-cols-5 text-xs text-center border-t border-gray-100 ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  }`}
                >
                  <div className="px-2 py-3 border-l border-gray-100 font-bold text-green-700">
                    {row.house_number}
                  </div>
                  <div className="px-2 py-3 border-l border-gray-100 text-gray-800 font-medium truncate">
                    {row.house_name}
                  </div>
                  <div className="px-2 py-3 border-l border-gray-100 text-gray-600">
                    {row.family_name}
                  </div>
                  <div className="px-2 py-3 border-l border-gray-100">
                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">
                      {row.sector}
                    </span>
                  </div>
                  <div className="px-2 py-3 text-purple-600 font-bold">
                    {row.individual_count}
                  </div>
                </div>
              ))}

              <div className="grid grid-cols-5 bg-green-50 border-t-2 border-green-200 text-xs font-bold text-center">
                <div className="px-2 py-3 border-l border-green-200 text-green-700 col-span-3 text-right pr-4">
                  الإجمالي
                </div>
                <div className="px-2 py-3 border-l border-green-200"></div>
                <div className="px-2 py-3 text-purple-700">
                  {rows.reduce((s, r) => s + r.individual_count, 0)}
                </div>
              </div>

            </div>
          </>
        )}

        <p className="text-center text-xs text-gray-400 mt-3 pb-4">
          {rows.length} سجل
        </p>
      </div>
    </div>
  )
}