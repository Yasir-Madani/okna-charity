'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import { Home, Users, MapPin, Hash, ChevronLeft } from 'lucide-react' // اختياري: ستحتاج لتثبيت lucide-react

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
            family_name: 'بدون أسرة',
            sector: house.sector,
            individual_count: 0,
          })
        }
      })
      setRows(expanded)
    }
    setLoading(false)
  }

  const totalIndividuals = rows.reduce((s, r) => s + r.individual_count, 0)

  return (
    <div className="min-h-screen bg-[#F8FAFC]" dir="rtl">
      {/* Header العصري */}
      <div className="bg-white border-b border-gray-100 px-5 py-4 sticky top-0 z-30 shadow-sm">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-black text-gray-900">نظرة عامة</h1>
            <p className="text-xs text-gray-500 mt-0.5">إحصائيات المنازل والعوائل</p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="p-2 bg-gray-50 hover:bg-green-50 text-green-700 rounded-xl transition-colors border border-gray-100"
          >
            <ChevronLeft size={20} />
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        
        {/* ملخص سريع (Stats) */}
        {!loading && rows.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-green-600 p-4 rounded-2xl text-white shadow-lg shadow-green-100">
              <p className="text-xs opacity-80 mb-1">إجمالي الأفراد</p>
              <p className="text-2xl font-bold">{totalIndividuals}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">عدد السجلات</p>
              <p className="text-2xl font-bold text-gray-800">{rows.length}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
             <p className="text-gray-400 text-sm mt-4 font-medium">جاري جلب البيانات...</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
            <p className="text-gray-400 text-sm">لا توجد بيانات مسجلة حالياً</p>
          </div>
        ) : (
          <div className="space-y-4">
            {rows.map((row, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
              >
                {/* خلفية جمالية خفيفة */}
                <div className="absolute top-0 left-0 w-1.5 h-full bg-green-500"></div>
                
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                      <Home size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-base">{row.house_name}</h3>
                      <div className="flex items-center text-gray-400 text-[10px] mt-0.5 gap-1">
                        <Hash size={12} />
                        <span>رقم المنزل: {row.house_number}</span>
                      </div>
                    </div>
                  </div>
                  <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-[10px] font-bold border border-blue-100">
                    {row.sector}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-50">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-gray-400" />
                    <div>
                      <p className="text-[10px] text-gray-400 leading-none mb-1">اسم العائلة</p>
                      <p className="text-sm font-semibold text-gray-700">{row.family_name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 justify-end">
                    <div className="text-left">
                      <p className="text-[10px] text-gray-400 leading-none mb-1">أفراد الأسرة</p>
                      <p className="text-sm font-black text-purple-600">{row.individual_count} فرد</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="h-20"></div> {/* مساحة إضافية للتمرير */}
      </div>
    </div>
  )
}