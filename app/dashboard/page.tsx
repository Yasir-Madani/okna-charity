'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import { House } from '../lib/types'

export default function Dashboard() {
  const [houses, setHouses] = useState<House[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sectorFilter, setSectorFilter] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const router = useRouter()

  useEffect(() => { checkUser() }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }
    fetchHouses()
  }

  const fetchHouses = async () => {
    const { data } = await supabase
      .from('houses')
      .select(`*, families(id, individuals(id))`)
      .order('house_number', { ascending: true })
    if (data) setHouses(data as any)
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const filtered = houses
    .filter(h => {
      const matchSearch =
        h.name.includes(search) ||
        (h.house_number && h.house_number.toString().includes(search))
      const matchSector = sectorFilter ? h.sector === sectorFilter : true
      return matchSearch && matchSector
    })
    .sort((a, b) => {
      const numA = a.house_number ? Number(a.house_number) : Infinity
      const numB = b.house_number ? Number(b.house_number) : Infinity
      return numA - numB
    })

  const getFamilyCount = (house: any) => house.families?.length || 0
  const getIndividualCount = (house: any) =>
    house.families?.reduce((sum: number, f: any) => sum + (f.individuals?.length || 0), 0) || 0

  const totalFamilies = houses.reduce((sum, h) => sum + getFamilyCount(h), 0)
  const totalIndividuals = houses.reduce((sum, h) => sum + getIndividualCount(h), 0)

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">

      {/* ===== شريط العنوان ===== */}
      <div className="bg-green-700 text-white px-4 py-3 flex justify-between items-center sticky top-0 z-20 shadow-md">
       

        <button onClick={() => router.push('/dashboard/import')}>
          📥 رفع من Excel
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/dashboard/houses/new')}
            className="bg-white text-green-700 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
          >
            + منزل
          </button>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs cursor-pointer"
          >
            ☰ قائمة
          </button>
        </div>
      </div>

      {/* القائمة المنسدلة */}
      {menuOpen && (
        <div className="bg-green-800 text-white px-4 py-3 space-y-2 z-10 shadow-lg">
          <button
            onClick={() => { router.push('/dashboard/subscriptions'); setMenuOpen(false) }}
            className="w-full text-right py-2.5 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-sm cursor-pointer"
          >
            💳 الاشتراكات الشهرية
          </button>
          <button
            onClick={() => { router.push('/dashboard/subscriptions/overdue-report'); setMenuOpen(false) }}
            className="w-full text-right py-2.5 px-3 rounded-lg bg-red-500/30 hover:bg-red-500/50 text-sm cursor-pointer"
          >
            ⚠️ تقرير المتأخرين
          </button>
          <button
            onClick={() => { router.push('/dashboard/statistics'); setMenuOpen(false) }}
            className="w-full text-right py-2.5 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-sm cursor-pointer"
          >
            📊 الإحصائيات
          </button>
          <button
            onClick={() => { router.push('/'); setMenuOpen(false) }}
            className="w-full text-right py-2.5 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-sm cursor-pointer"
          >
            🏠 الرئيسية
          </button>




          <button
  onClick={() => { router.push('/dashboard/statistics/annual'); setMenuOpen(false) }}
  className="w-full text-right py-2.5 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-sm cursor-pointer"
>
  📊 التقرير السنوي
</button>

<button
  onClick={() => { router.push('/dashboard/subscriptions/unpaid-quick'); setMenuOpen(false) }}
  className="w-full text-right py-2.5 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-sm cursor-pointer"
>
  ⚡ من لم يدفع — سريع
</button>

<button
  onClick={() => { router.push('/dashboard/backup'); setMenuOpen(false) }}
  className="w-full text-right py-2.5 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-sm cursor-pointer"
>
  💾 النسخة الاحتياطية
</button>

          <button
            onClick={handleLogout}
            className="w-full text-right py-2.5 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-sm cursor-pointer text-red-300"
          >
            🚪 تسجيل الخروج
          </button>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-3 py-3 space-y-3">

        {/* ===== بطاقات الإحصاء ===== */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm text-center">
            <p className="text-2xl font-bold text-green-600">{houses.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">منزل</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm text-center">
            <p className="text-2xl font-bold text-blue-600">{totalFamilies}</p>
            <p className="text-xs text-gray-400 mt-0.5">أسرة</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm text-center">
            <p className="text-2xl font-bold text-purple-600">{totalIndividuals}</p>
            <p className="text-xs text-gray-400 mt-0.5">فرد</p>
          </div>
        </div>

        {/* ===== البحث والفلتر ===== */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 space-y-2">
          <input
            placeholder="ابحث باسم أو رقم المنزل..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <select
            value={sectorFilter}
            onChange={e => setSectorFilter(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">كل المحاور</option>
            <option value="شرق">شرق</option>
            <option value="شمال">شمال</option>
            <option value="وسط">وسط</option>
            <option value="الدوراشاب">الدوراشاب</option>
          </select>
        </div>

        {/* ===== قائمة المنازل ===== */}
        {loading ? (
          <p className="text-center text-gray-400 text-sm py-10">جاري التحميل...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-10">لا توجد منازل</p>
        ) : (
          <div className="space-y-2">

            {/* ===== صف العنوان ===== */}
            <div className="bg-black text-white rounded-xl px-4 py-2.5 flex items-center gap-3">
              <div className="w-10 flex-shrink-0 text-center text-xs font-bold">رقم</div>
              <div className="flex-1 text-sm font-bold">إسم المنزل</div>
              <div className="text-xs font-bold opacity-70">التفاصيل</div>
            </div>

            {filtered.map(house => (
              <div
                key={house.id}
                onClick={() => router.push(`/dashboard/houses/${house.id}`)}
                className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 flex items-center gap-3 cursor-pointer hover:border-green-300 active:bg-green-50 transition-all"
              >
                {/* رقم المنزل */}
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-green-700">
                    {house.house_number || '—'}
                  </span>
                </div>

                {/* المعلومات */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 text-sm truncate">{house.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      {house.sector}
                    </span>
                    <span className="text-xs text-gray-400">
                      {getFamilyCount(house)} أسرة · {getIndividualCount(house)} فرد
                    </span>
                  </div>
                </div>

                {/* سهم */}
                <span className="text-black-300 text-lg flex-shrink-0">← عرض</span>
              </div>
            ))}
          </div>
        )}

        <p className="text-center text-xs text-gray-400 pb-4">
          {filtered.length} من {houses.length} منزل
        </p>
      </div>
    </div>
  )
}
