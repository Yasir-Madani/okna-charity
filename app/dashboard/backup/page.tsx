'use client'
// ============================================================
// app/dashboard/backup/page.tsx
// نسخة احتياطية كاملة لجميع البيانات
// ============================================================

import { useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

type BackupStatus = 'idle' | 'loading' | 'done' | 'error'

type TableStat = {
  name: string
  label: string
  icon: string
  count: number
}

export default function BackupPage() {
  const router = useRouter()
  const [status, setStatus] = useState<BackupStatus>('idle')
  const [stats, setStats] = useState<TableStat[]>([])
  const [errorMsg, setErrorMsg] = useState('')
  const [lastBackup, setLastBackup] = useState<string | null>(null)
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json')

  const runBackup = useCallback(async () => {
    setStatus('loading')
    setErrorMsg('')
    setStats([])

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }

      // جلب كل البيانات
      const [
        { data: houses },
        { data: families },
        { data: individuals },
        { data: subscriptions },
        { data: settings },
      ] = await Promise.all([
        supabase.from('houses').select('*').order('house_number'),
        supabase.from('families').select('*'),
        supabase.from('individuals').select('*'),
        supabase.from('subscriptions').select('*').order('month'),
        supabase.from('settings').select('*'),
      ])

      const tableStats: TableStat[] = [
        { name: 'houses', label: 'المنازل', icon: '🏠', count: houses?.length || 0 },
        { name: 'families', label: 'الأسر', icon: '👨‍👩‍👧', count: families?.length || 0 },
        { name: 'individuals', label: 'الأفراد', icon: '👤', count: individuals?.length || 0 },
        { name: 'subscriptions', label: 'الاشتراكات', icon: '💳', count: subscriptions?.length || 0 },
        { name: 'settings', label: 'الإعدادات', icon: '⚙️', count: settings?.length || 0 },
      ]
      setStats(tableStats)

      const now = new Date()
      const dateStr = now.toISOString().split('T')[0]
      const timeStr = now.toLocaleTimeString('ar-EG')

      if (exportFormat === 'json') {
        // تصدير JSON كامل
        const backup = {
          exported_at: now.toISOString(),
          exported_by: user.email || user.id,
          version: '1.0',
          data: { houses, families, individuals, subscriptions, settings }
        }
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `نسخة_احتياطية_${dateStr}.json`
        a.click()
        URL.revokeObjectURL(url)

      } else {
        // تصدير CSV — ملف واحد لكل جدول مدمجة في zip (أو نصدر كل جدول منفرداً)
        const BOM = '\uFEFF'
        const tables = [
          { name: 'المنازل', data: houses, headers: ['id', 'house_number', 'name', 'sector', 'created_at'] },
          { name: 'الاشتراكات', data: subscriptions, headers: ['id', 'house_id', 'month', 'amount', 'notes', 'created_by', 'created_at'] },
          { name: 'الأسر', data: families, headers: ['id', 'house_id', 'name', 'created_at'] },
          { name: 'الأفراد', data: individuals, headers: ['id', 'family_id', 'name', 'age', 'gender', 'notes', 'created_at'] },
        ]

        for (const table of tables) {
          if (!table.data || table.data.length === 0) continue
          const rows = [table.headers.join(',')]
          table.data.forEach((row: any) => {
            rows.push(table.headers.map(h => {
              const val = row[h]
              if (val === null || val === undefined) return ''
              if (typeof val === 'string' && val.includes(',')) return `"${val}"`
              return String(val)
            }).join(','))
          })
          const blob = new Blob([BOM + rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${table.name}_${dateStr}.csv`
          a.click()
          URL.revokeObjectURL(url)
          await new Promise(r => setTimeout(r, 300)) // تأخير بين الملفات
        }
      }

      setLastBackup(`${dateStr} — ${timeStr}`)
      setStatus('done')

    } catch (err: any) {
      setErrorMsg(err?.message || 'حدث خطأ غير متوقع')
      setStatus('error')
    }
  }, [exportFormat, router])

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* هيدر */}
      <div className="bg-green-700 text-white px-4 py-3 flex justify-between items-center sticky top-0 z-20 shadow-md">
        <h1 className="text-base font-bold">💾 النسخة الاحتياطية</h1>
        <button onClick={() => router.push('/dashboard')} className="bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs cursor-pointer">
          رجوع
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-3 py-4 space-y-3">

        {/* بطاقة التوضيح */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-blue-700 font-bold text-sm mb-1">📋 ماذا تشمل النسخة الاحتياطية؟</p>
          <p className="text-blue-600 text-xs leading-relaxed">
            تشمل جميع بيانات النظام: المنازل، الأسر، الأفراد، الاشتراكات، والإعدادات.
            احفظ النسخة في مكان آمن واعمل نسخة دورية كل شهر.
          </p>
        </div>

        {/* اختيار الصيغة */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
          <p className="text-sm font-bold text-gray-700">اختر صيغة التصدير</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setExportFormat('json')}
              className={`p-3 rounded-xl border-2 text-right transition-all cursor-pointer ${exportFormat === 'json' ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'}`}
            >
              <div className="text-xl mb-1">📦</div>
              <div className="text-sm font-bold text-gray-800">JSON</div>
              <div className="text-xs text-gray-400 mt-0.5">ملف واحد — للنسخ الاحتياطية الكاملة</div>
              {exportFormat === 'json' && <div className="text-xs text-green-600 mt-1 font-bold">✓ مختار</div>}
            </button>
            <button
              onClick={() => setExportFormat('csv')}
              className={`p-3 rounded-xl border-2 text-right transition-all cursor-pointer ${exportFormat === 'csv' ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'}`}
            >
              <div className="text-xl mb-1">📊</div>
              <div className="text-sm font-bold text-gray-800">Excel (CSV)</div>
              <div className="text-xs text-gray-400 mt-0.5">ملفات منفصلة — للعرض في Excel</div>
              {exportFormat === 'csv' && <div className="text-xs text-green-600 mt-1 font-bold">✓ مختار</div>}
            </button>
          </div>
        </div>

        {/* إحصاء البيانات بعد النسخ */}
        {stats.length > 0 && (
          <div className="bg-white rounded-xl border border-green-200 shadow-sm p-4">
            <p className="text-sm font-bold text-green-700 mb-3">✅ تم تصدير البيانات التالية:</p>
            <div className="grid grid-cols-2 gap-2">
              {stats.map(s => (
                <div key={s.name} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2.5">
                  <span className="text-lg">{s.icon}</span>
                  <div>
                    <p className="text-xs text-gray-400">{s.label}</p>
                    <p className="text-sm font-bold text-gray-800">{s.count.toLocaleString()} سجل</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* رسالة الخطأ */}
        {status === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-700 font-bold text-sm">❌ حدث خطأ</p>
            <p className="text-red-600 text-xs mt-1">{errorMsg}</p>
          </div>
        )}

        {/* آخر نسخة */}
        {lastBackup && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
            <p className="text-green-600 text-xs">
              آخر نسخة احتياطية: <strong>{lastBackup}</strong>
            </p>
          </div>
        )}

        {/* نصائح */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
          <p className="text-amber-700 font-bold text-xs">💡 نصائح مهمة</p>
          <ul className="text-amber-600 text-xs space-y-1 leading-relaxed">
            <li>• اعمل نسخة احتياطية في بداية كل شهر</li>
            <li>• احفظ ملف JSON في Google Drive أو البريد الإلكتروني</li>
            <li>• ملف JSON يمكن استخدامه لاستعادة البيانات لاحقاً</li>
            <li>• ملفات CSV تفتح مباشرة في Excel للمراجعة</li>
          </ul>
        </div>

        {/* زر التصدير */}
        <button
          onClick={runBackup}
          disabled={status === 'loading'}
          className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white py-4 rounded-xl text-base font-bold cursor-pointer transition-colors shadow-sm flex items-center justify-center gap-2"
        >
          {status === 'loading' ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              جاري التصدير...
            </>
          ) : status === 'done' ? (
            '✅ تم التصدير — اضغط لتصدير مرة أخرى'
          ) : (
            `💾 تصدير النسخة الاحتياطية (${exportFormat.toUpperCase()})`
          )}
        </button>

      </div>
    </div>
  )
}
