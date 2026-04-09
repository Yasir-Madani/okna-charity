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
      // نفرد كل أسرة في سطر مستقل
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
          // منزل بدون أسر
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
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

            {/* رأس الجدول */}
            <div className="grid grid-cols-5 bg-green-700 text-white text-xs font-bold text-center">
              <div className="px-2 py-3 border-l border-green-600">رقم المنزل</div>
              <div className="px-2 py-3 border-l border-green-600">اسم المنزل</div>
              <div className="px-2 py-3 border-l border-green-600">اسم الأسرة</div>
              <div className="px-2 py-3 border-l border-green-600">المحور</div>
              <div className="px-2 py-3">عدد الأفراد</div>
            </div>

            {/* صفوف البيانات */}
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

            {/* سطر المجموع */}
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
        )}

        <p className="text-center text-xs text-gray-400 mt-3 pb-4">
          {rows.length} سجل
        </p>
      </div>
    </div>
  )
}
