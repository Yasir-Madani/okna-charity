'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

type LogEntry = {
  id: string
  event_type: string
  device_type: string
  browser: string
  os: string
  fingerprint: string
  installed_at: string
}

type StatCard = {
  label: string
  value: number | string
  icon: string
  color: string
  bg: string
}

function count(logs: LogEntry[], key: keyof LogEntry, val: string) {
  return logs.filter(l => l[key] === val).length
}

function groupBy(logs: LogEntry[], key: keyof LogEntry) {
  return logs.reduce((acc: Record<string, number>, l) => {
    const k = l[key] as string || 'غير معروف'
    acc[k] = (acc[k] || 0) + 1
    return acc
  }, {})
}

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '13px', color: '#374151', fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: '13px', color: '#6b7280' }}>{value} ({pct}%)</span>
      </div>
      <div style={{ background: '#f3f4f6', borderRadius: '6px', height: '8px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '6px', transition: 'width 0.6s ease' }} />
      </div>
    </div>
  )
}

export default function InstallStatsPage() {
  const router = useRouter()
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'installed' | 'dismissed' | 'prompt_shown' | 'ios_shown'>('all')

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    fetchLogs()
  }

  const fetchLogs = async () => {
    const { data } = await supabase
      .from('install_tracking')
      .select('*')
      .order('installed_at', { ascending: false })
    setLogs(data || [])
    setLoading(false)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'Cairo, sans-serif' }}>
      <p style={{ color: '#6b7280', fontSize: '16px' }}>جاري التحميل...</p>
    </div>
  )

  const installed  = logs.filter(l => l.event_type === 'installed')
  const shown      = logs.filter(l => l.event_type === 'prompt_shown' || l.event_type === 'ios_shown')
  const dismissed  = logs.filter(l => l.event_type === 'dismissed')
  const convRate   = shown.length > 0 ? ((installed.length / shown.length) * 100).toFixed(1) : '0'

  // unique devices that installed (by fingerprint)
  const uniqueInstalls = new Set(installed.map(l => l.fingerprint)).size

  const deviceGroups  = groupBy(installed, 'device_type')
  const browserGroups = groupBy(installed, 'browser')
  const osGroups      = groupBy(installed, 'os')

  const maxDevice  = Math.max(...Object.values(deviceGroups), 1)
  const maxBrowser = Math.max(...Object.values(browserGroups), 1)
  const maxOS      = Math.max(...Object.values(osGroups), 1)

  const deviceColors: Record<string, string>  = { ios: '#3b82f6', android: '#22c55e', desktop: '#a855f7' }
  const browserColors: Record<string, string> = { Chrome: '#f59e0b', Safari: '#3b82f6', Firefox: '#ef4444', Edge: '#06b6d4' }
  const osColors: Record<string, string>      = { iOS: '#3b82f6', Android: '#22c55e', Windows: '#6366f1', MacOS: '#f59e0b', Linux: '#14b8a6' }

  const statCards: StatCard[] = [
    { label: 'إجمالي التثبيتات',  value: installed.length,  icon: '✅', color: '#16a34a', bg: '#dcfce7' },
    { label: 'أجهزة فريدة',        value: uniqueInstalls,     icon: '📱', color: '#2563eb', bg: '#dbeafe' },
    { label: 'مرات الظهور',        value: shown.length,       icon: '👁️', color: '#7c3aed', bg: '#ede9fe' },
    { label: 'معدل التحويل',       value: `${convRate}%`,     icon: '📈', color: '#d97706', bg: '#fef3c7' },
    { label: 'مرات الرفض',         value: dismissed.length,   icon: '❌', color: '#dc2626', bg: '#fee2e2' },
    { label: 'إجمالي الأحداث',     value: logs.length,        icon: '📊', color: '#0891b2', bg: '#cffafe' },
  ]

  const filteredLogs = filter === 'all' ? logs : logs.filter(l => l.event_type === filter)

  const eventLabel = (type: string) => ({
    installed:    '✅ تثبيت',
    dismissed:    '❌ رفض',
    ios_shown:    '👁️ iOS',
    prompt_shown: '👁️ ظهور',
  }[type] || type)

  const eventBadge = (type: string) => ({
    installed:    { bg: '#dcfce7', color: '#16a34a' },
    dismissed:    { bg: '#fee2e2', color: '#dc2626' },
    ios_shown:    { bg: '#ede9fe', color: '#7c3aed' },
    prompt_shown: { bg: '#dbeafe', color: '#2563eb' },
  }[type] || { bg: '#f3f4f6', color: '#374151' })

  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif", background: '#f5f7fa', minHeight: '100vh', padding: '20px 16px 40px' }}>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet" />

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button
          onClick={() => router.push('/home')}
          style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '8px 14px', fontSize: '13px', fontWeight: 700, color: '#374151', cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}
        >
          ← رجوع
        </button>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#111827', margin: 0 }}>إحصائيات برمجية</h1>
          <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>تتبع تثبيت التطبيق على الأجهزة</p>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
        {statCards.map((c) => (
          <div key={c.label} style={{ background: 'white', borderRadius: '16px', padding: '14px 12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', textAlign: 'center' }}>
            <div style={{ fontSize: '22px', marginBottom: '4px' }}>{c.icon}</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: c.color }}>{c.value}</div>
            <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px', lineHeight: 1.3 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* ── Charts Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>

        {/* Devices */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#111827', margin: '0 0 14px' }}>📱 الأجهزة</h3>
          {Object.entries(deviceGroups).length === 0
            ? <p style={{ fontSize: '12px', color: '#9ca3af' }}>لا توجد بيانات</p>
            : Object.entries(deviceGroups).map(([k, v]) => (
              <Bar key={k} label={k} value={v} max={maxDevice} color={deviceColors[k] || '#8b5cf6'} />
            ))}
        </div>

        {/* Browsers */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#111827', margin: '0 0 14px' }}>🌐 المتصفحات</h3>
          {Object.entries(browserGroups).length === 0
            ? <p style={{ fontSize: '12px', color: '#9ca3af' }}>لا توجد بيانات</p>
            : Object.entries(browserGroups).map(([k, v]) => (
              <Bar key={k} label={k} value={v} max={maxBrowser} color={browserColors[k] || '#6b7280'} />
            ))}
        </div>

        {/* OS */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#111827', margin: '0 0 14px' }}>💻 نظام التشغيل</h3>
          {Object.entries(osGroups).length === 0
            ? <p style={{ fontSize: '12px', color: '#9ca3af' }}>لا توجد بيانات</p>
            : Object.entries(osGroups).map(([k, v]) => (
              <Bar key={k} label={k} value={v} max={maxOS} color={osColors[k] || '#6b7280'} />
            ))}
        </div>
      </div>

      {/* ── Event Log ── */}
      <div style={{ background: 'white', borderRadius: '16px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#111827', margin: 0 }}>سجل الأحداث</h3>

          {/* Filter buttons */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {(['all', 'installed', 'prompt_shown', 'ios_shown', 'dismissed'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'Cairo, sans-serif', border: 'none',
                  background: filter === f ? '#0f2a5e' : '#f3f4f6',
                  color: filter === f ? 'white' : '#374151',
                }}
              >
                {f === 'all' ? 'الكل' : eventLabel(f)}
              </button>
            ))}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {['الحدث', 'الجهاز', 'المتصفح', 'نظام التشغيل', 'معرف الجهاز', 'التاريخ والوقت'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'right', color: '#6b7280', fontWeight: 700, borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#9ca3af' }}>لا توجد سجلات</td>
                </tr>
              ) : filteredLogs.map((log) => {
                const badge = eventBadge(log.event_type)
                return (
                  <tr key={log.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: badge.bg, color: badge.color, whiteSpace: 'nowrap' }}>
                        {eventLabel(log.event_type)}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#374151' }}>{log.device_type || '—'}</td>
                    <td style={{ padding: '10px 12px', color: '#374151' }}>{log.browser || '—'}</td>
                    <td style={{ padding: '10px 12px', color: '#374151' }}>{log.os || '—'}</td>
                    <td style={{ padding: '10px 12px', color: '#9ca3af', fontFamily: 'monospace', fontSize: '11px' }}>{log.fingerprint?.slice(0, 12) || '—'}...</td>
                    <td style={{ padding: '10px 12px', color: '#6b7280', whiteSpace: 'nowrap' }}>
                      {new Date(log.installed_at).toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '12px', textAlign: 'left' }}>
          إجمالي السجلات: {filteredLogs.length}
        </p>
      </div>
    </div>
  )
}
