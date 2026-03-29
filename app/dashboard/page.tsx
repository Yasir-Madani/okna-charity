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
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }
    fetchHouses()
  }

  const fetchHouses = async () => {
    const { data } = await supabase
      .from('houses')
      .select(`
        *,
        families (
          id,
          individuals (id)
        )
      `)
      .order('created_at', { ascending: false })
    if (data) setHouses(data as any)
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const filtered = houses.filter(h => {
    const matchSearch = h.name.includes(search)
    const matchSector = sectorFilter ? h.sector === sectorFilter : true
    return matchSearch && matchSector
  })

  const getFamilyCount = (house: any) => house.families?.length || 0
  const getIndividualCount = (house: any) =>
    house.families?.reduce((sum: number, f: any) => sum + (f.individuals?.length || 0), 0) || 0

  return (
    <div className="min-h-screen bg-gray-100" dir="rtl">
      <div className="bg-green-600 text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">جمعية العكنة الخيرية</h1>
        <div className="flex gap-3">


          <button
  onClick={() => router.push('/dashboard/statistics')}
  className="bg-white text-green-600 px-3 py-1 rounded text-sm font-bold cursor-pointer"
>
  الإحصائيات
</button>


          <button
            onClick={() => router.push('/dashboard/houses/new')}
            className="bg-white text-green-600 px-3 py-1 rounded text-sm font-bold cursor-pointer"
          >
            + إضافة منزل
          </button>
          <button
            onClick={handleLogout}
            className="bg-white text-green-600 px-3 py-1 rounded text-sm cursor-pointer"
          >
            خروج
          </button>
        </div>
      </div>

      <div className="p-4 max-w-5xl mx-auto">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <p className="text-3xl font-bold text-green-600">{houses.length}</p>
            <p className="text-gray-600 text-sm">إجمالي المنازل</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <p className="text-3xl font-bold text-blue-600">
              {houses.reduce((sum, h) => sum + getFamilyCount(h), 0)}
            </p>
            <p className="text-gray-600 text-sm">إجمالي الأسر</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <p className="text-3xl font-bold text-purple-600">
              {houses.reduce((sum, h) => sum + getIndividualCount(h), 0)}
            </p>
            <p className="text-gray-600 text-sm">إجمالي الأفراد</p>
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg shadow mb-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">بحث باسم المنزل</label>
              <input
                placeholder="ابحث..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="border rounded p-2 text-right text-sm w-full h-10"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">المحور</label>
              <select
                value={sectorFilter}
                onChange={e => setSectorFilter(e.target.value)}
                className="border rounded p-2 text-right text-sm w-full h-10"
              >
                <option value="">كل المحاور</option>
                <option value="شرق">شرق</option>
                <option value="شمال">شمال</option>
                <option value="وسط">وسط</option>
                <option value="الدوراشاب">الدوراشاب</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <p className="text-center text-gray-500">جاري التحميل...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-500 mt-8">لا توجد منازل بعد</p>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-right">اسم المنزل</th>
                  <th className="p-3 text-right">المحور</th>
                  <th className="p-3 text-center">عدد الأسر</th>
                  <th className="p-3 text-center">عدد الأفراد</th>
                  <th className="p-3 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(house => (
                  <tr key={house.id} className="border-t hover:bg-gray-50">
                    <td className="p-3 font-bold">{house.name}</td>
                    <td className="p-3">
                      <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs">
                        {house.sector}
                      </span>
                    </td>
                    <td className="p-3 text-center">{getFamilyCount(house)}</td>
                    <td className="p-3 text-center">{getIndividualCount(house)}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => router.push(`/dashboard/houses/${house.id}`)}
                        className="text-green-600 text-sm underline cursor-pointer"
                      >
                        عرض
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}