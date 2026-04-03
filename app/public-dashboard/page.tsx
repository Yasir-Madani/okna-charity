'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import { getAgeCategory } from '../lib/helpers'

export default function PublicDashboard() {
  const [stats, setStats] = useState({
    totalIndividuals: 0,
    totalHouses: 0,
    totalFamilies: 0,
    males: 0,
    females: 0,
    infants: 0,
    children: 0,
    youth: 0,
    adults: 0,
    elderly: 0,
    diseased: 0,
    disabled: 0,
    sectors: {} as Record<string, number>
  })
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => { fetchStats() }, [])

  const fetchStats = async () => {
    const [{ count: houses }, { count: families }, { data: individuals }] = await Promise.all([
      supabase.from('houses').select('*', { count: 'exact', head: true }),
      supabase.from('families').select('*', { count: 'exact', head: true }),
      supabase.from('individuals').select(`
        gender, birth_date,
        individual_diseases(id),
        individual_disabilities(id),
        families(houses(sector))
      `)
    ])

    if (!individuals) return

    const sectors: Record<string, number> = {}
    let males = 0, females = 0
    let infants = 0, children = 0, youth = 0, adults = 0, elderly = 0
    let diseased = 0, disabled = 0

    individuals.forEach(ind => {
      if (ind.gender === 'ذكر') males++
      else females++

      if (ind.birth_date) {
        const cat = getAgeCategory(ind.birth_date)
        if (cat === 'رضيع') infants++
        else if (cat === 'طفل') children++
        else if (cat === 'شاب') youth++
        else if (cat === 'بالغ') adults++
        else if (cat === 'مسن') elderly++
      }

      if (ind.individual_diseases && ind.individual_diseases.length > 0) diseased++
      if (ind.individual_disabilities && ind.individual_disabilities.length > 0) disabled++

      const sector = (ind.families as any)?.houses?.sector
      if (sector) sectors[sector] = (sectors[sector] || 0) + 1
    })

    setStats({
      totalIndividuals: individuals.length,
      totalHouses: houses || 0,
      totalFamilies: families || 0,
      males, females, infants, children, youth, adults, elderly,
      diseased, disabled, sectors
    })
    setLoading(false)
  }

  const cards = [
    { label: 'إجمالي الأفراد', value: stats.totalIndividuals, icon: '👥', color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50', text: 'text-blue-700' },
    { label: 'إجمالي المنازل', value: stats.totalHouses, icon: '🏠', color: 'from-green-500 to-green-600', bg: 'bg-green-50', text: 'text-green-700' },
    { label: 'إجمالي الأسر', value: stats.totalFamilies, icon: '👨‍👩‍👧‍👦', color: 'from-orange-500 to-orange-600', bg: 'bg-orange-50', text: 'text-orange-700' },
    { label: 'الذكور', value: stats.males, icon: '👨', color: 'from-cyan-500 to-cyan-600', bg: 'bg-cyan-50', text: 'text-cyan-700' },
    { label: 'الإناث', value: stats.females, icon: '👩', color: 'from-pink-500 to-pink-600', bg: 'bg-pink-50', text: 'text-pink-700' },
    { label: 'الرضع', value: stats.infants, icon: '👶', color: 'from-violet-500 to-violet-600', bg: 'bg-violet-50', text: 'text-violet-700' },
    { label: 'الأطفال', value: stats.children, icon: '🧒', color: 'from-yellow-500 to-yellow-600', bg: 'bg-yellow-50', text: 'text-yellow-700' },
    { label: 'الشباب', value: stats.youth, icon: '🧑', color: 'from-lime-500 to-lime-600', bg: 'bg-lime-50', text: 'text-lime-700' },
    { label: 'البالغون', value: stats.adults, icon: '🧑‍💼', color: 'from-teal-500 to-teal-600', bg: 'bg-teal-50', text: 'text-teal-700' },
    { label: 'كبار السن', value: stats.elderly, icon: '👴', color: 'from-slate-500 to-slate-600', bg: 'bg-slate-50', text: 'text-slate-700' },
    { label: 'الأمراض المزمنة', value: stats.diseased, icon: '🏥', color: 'from-red-500 to-red-600', bg: 'bg-red-50', text: 'text-red-700' },
    { label: 'حالات الإعاقة', value: stats.disabled, icon: '♿', color: 'from-rose-500 to-rose-600', bg: 'bg-rose-50', text: 'text-rose-700' },
  ]

  const sectorColors: Record<string, string> = {
    'شرق': 'bg-blue-100 text-blue-800 border-blue-200',
    'شمال': 'bg-green-100 text-green-800 border-green-200',
    'وسط': 'bg-orange-100 text-orange-800 border-orange-200',
    'الدوراشاب': 'bg-purple-100 text-purple-800 border-purple-200',
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl" style={{ fontFamily: "'Cairo', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet" />

      <div className="bg-gradient-to-l from-blue-800 via-blue-700 to-blue-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="bg-white bg-opacity-20 rounded-xl p-3">
                
              </div>
              
            </div>
            

<button onClick={() => router.push('/home')}
            className="bg-white bg-opacity-20 text-black px-3 py-1.5 rounded-lg text-sm cursor-pointer hover:bg-opacity-30 transition-all">
             رجوع

</button>
          </div>
        </div>

        


      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500">جاري تحميل البيانات...</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-8 w-1 bg-blue-600 rounded-full"></div>
              
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
              {cards.map((card, i) => (
                <div key={i}
                  className={`${card.bg} rounded-2xl p-5 border border-opacity-30 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5`}
                  style={{ borderColor: 'currentColor' }}>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-2xl">{card.icon}</span>
                    <div className={`w-2 h-2 rounded-full bg-gradient-to-br ${card.color}`}></div>
                  </div>
                  <p className={`text-4xl font-bold ${card.text} mb-1`}>
                    {card.value.toLocaleString('ar')}
                  </p>
                  <p className="text-gray-600 text-sm font-medium">{card.label}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
              <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                <span className="text-blue-600">📍</span>
                التوزيع الجغرافي حسب المحور
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(stats.sectors).map(([sector, count]) => (
                  <div key={sector} className={`border rounded-xl p-4 text-center ${sectorColors[sector] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                    <p className="text-3xl font-bold mb-1">{count}</p>
                    <p className="text-sm font-medium">محور {sector}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {stats.totalIndividuals > 0
                        ? Math.round((count / stats.totalIndividuals) * 100)
                        : 0}%
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                <span className="text-green-600">📈</span>
                التوزيع العمري
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'رضيع (0-2)', value: stats.infants, color: 'bg-violet-500' },
                  { label: 'طفل (3-14)', value: stats.children, color: 'bg-yellow-500' },
                  { label: 'شاب (15-24)', value: stats.youth, color: 'bg-lime-500' },
                  { label: 'بالغ (25-64)', value: stats.adults, color: 'bg-teal-500' },
                  { label: 'مسن (65+)', value: stats.elderly, color: 'bg-slate-500' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 w-28 flex-shrink-0">{item.label}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                      <div
                        className={`${item.color} h-6 rounded-full flex items-center justify-end pr-2 transition-all duration-700`}
                        style={{ width: stats.totalIndividuals > 0 ? `${Math.max((item.value / stats.totalIndividuals) * 100, 2)}%` : '2%' }}
                      >
                        <span className="text-white text-xs font-bold">{item.value}</span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 w-8">
                      {stats.totalIndividuals > 0 ? Math.round((item.value / stats.totalIndividuals) * 100) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <footer className="text-center py-6 mt-4 border-t border-gray-200">
        <p className="text-gray-400 text-sm">© 2026 جمعية العكنة الخيرية — جميع الحقوق محفوظة</p>
        <p className="text-gray-300 text-xs mt-1">نظام الإحصاء السكاني — بيانات عامة</p>
      </footer>
    </div>
  )
}
