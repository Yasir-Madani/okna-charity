import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function InstallStatsPage() {
  const { data: logs } = await supabase
    .from('install_tracking')
    .select('*')
    .order('installed_at', { ascending: false })

  const total = logs?.length || 0
  const installed = logs?.filter(l => l.event_type === 'installed').length || 0
  const shown = logs?.filter(l => l.event_type === 'prompt_shown' || l.event_type === 'ios_shown').length || 0
  const dismissed = logs?.filter(l => l.event_type === 'dismissed').length || 0
  const conversionRate = shown > 0 ? ((installed / shown) * 100).toFixed(1) : '0'

  return (
    <div dir="rtl" style={{ fontFamily: 'Cairo, sans-serif', padding: '32px', background: '#f5f7fa', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '24px' }}>📊 إحصائيات تثبيت التطبيق</h1>

      {/* البطاقات */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: '✅ مرات التثبيت', value: installed, color: '#14b464' },
          { label: '👁️ مرات الظهور', value: shown, color: '#3b82f6' },
          { label: '❌ مرات الرفض', value: dismissed, color: '#ef4444' },
          { label: '📈 معدل التحويل', value: `${conversionRate}%`, color: '#f59e0b' },
        ].map((card) => (
          <div key={card.label} style={{ background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>{card.label}</div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: card.color }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* جدول التفاصيل */}
      <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>سجل الأحداث</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              {['الحدث', 'الجهاز', 'المتصفح', 'نظام التشغيل', 'التاريخ'].map(h => (
                <th key={h} style={{ padding: '12px', textAlign: 'right', fontSize: '13px', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs?.map((log) => (
              <tr key={log.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '12px', fontSize: '13px' }}>
                  <span style={{
                    padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                    background: log.event_type === 'installed' ? '#dcfce7' : log.event_type === 'dismissed' ? '#fee2e2' : '#dbeafe',
                    color: log.event_type === 'installed' ? '#16a34a' : log.event_type === 'dismissed' ? '#dc2626' : '#1d4ed8',
                  }}>
                    {log.event_type === 'installed' ? '✅ تثبيت' :
                     log.event_type === 'dismissed' ? '❌ رفض' :
                     log.event_type === 'ios_shown' ? '👁️ iOS' : '👁️ ظهور'}
                  </span>
                </td>
                <td style={{ padding: '12px', fontSize: '13px', color: '#374151' }}>{log.device_type}</td>
                <td style={{ padding: '12px', fontSize: '13px', color: '#374151' }}>{log.browser}</td>
                <td style={{ padding: '12px', fontSize: '13px', color: '#374151' }}>{log.os}</td>
                <td style={{ padding: '12px', fontSize: '13px', color: '#6b7280' }}>
                  {new Date(log.installed_at).toLocaleString('ar-SA')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}