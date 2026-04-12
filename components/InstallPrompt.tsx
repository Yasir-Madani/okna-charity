'use client'

import { useEffect, useState } from 'react'

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true

    if (isStandalone) return

    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(ios)

    if (ios) {
      setTimeout(() => setShow(true), 1500)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setTimeout(() => setShow(true), 1500)
    }

    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => setShow(false))

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setShow(false)
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShow(false)
    setDismissed(true)
  }

  if (!show || dismissed) return null

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;700;800&display=swap');
        .pwa-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.55);
          backdrop-filter: blur(4px);
          z-index: 9998;
          animation: fadeIn 0.3s ease;
        }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        .pwa-sheet {
          position: fixed; bottom: 0; left: 0; right: 0;
          z-index: 9999;
          font-family: 'Cairo', sans-serif;
          direction: rtl;
          background: #0f1a2e;
          border-top: 1px solid rgba(20,180,100,0.25);
          border-radius: 24px 24px 0 0;
          padding: 28px 24px 36px;
          animation: slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1);
          box-shadow: 0 -20px 60px rgba(0,0,0,0.5);
        }
        @keyframes slideUp { from{transform:translateY(100%)} to{transform:translateY(0)} }
        .pwa-handle { width:40px; height:4px; border-radius:2px; background:rgba(255,255,255,0.15); margin:0 auto 24px; }
        .pwa-top { display:flex; align-items:center; gap:14px; margin-bottom:16px; }
        .pwa-icon { width:56px; height:56px; border-radius:16px; background:linear-gradient(135deg,#14b464,#0a7a3e); display:flex; align-items:center; justify-content:center; flex-shrink:0; box-shadow:0 4px 20px rgba(20,180,100,0.4); }
        .pwa-icon svg { width:28px; height:28px; color:#fff; }
        .pwa-texts h3 { font-size:18px; font-weight:800; color:#fff; margin-bottom:4px; }
        .pwa-texts p { font-size:13px; color:rgba(255,255,255,0.55); font-weight:400; line-height:1.5; }
        .pwa-name {
          text-align: center;
          font-size: 15px;
          font-weight: 700;
          color: rgba(255,255,255,0.75);
          padding: 10px 0 22px;
          letter-spacing: 0.03em;
            font-family: 'Cairo', sans-serif;  /* ← أضف هذا */

        }
        .pwa-steps { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:14px 16px; margin-bottom:18px; display:flex; flex-direction:column; gap:10px; }
        .pwa-step { display:flex; align-items:center; gap:10px; }
        .pwa-step-num { width:22px; height:22px; border-radius:50%; background:rgba(20,180,100,0.2); border:1px solid rgba(20,180,100,0.4); color:#14b464; font-size:11px; font-weight:800; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .pwa-step-text { font-size:13px; color:rgba(255,255,255,0.75); font-weight:500; }
        .pwa-step-text strong { color:#fff; }
        .pwa-btn-install { width:100%; padding:15px; border-radius:14px; background:linear-gradient(135deg,#14b464,#0d8045); color:#fff; font-family:'Cairo',sans-serif; font-size:16px; font-weight:800; border:none; cursor:pointer; margin-bottom:10px; box-shadow:0 4px 20px rgba(20,180,100,0.35); transition:transform 0.15s ease; letter-spacing:0.02em; }
        .pwa-btn-install:active { transform:scale(0.98); }
        .pwa-btn-dismiss { width:100%; padding:13px; border-radius:14px; background:transparent; color:rgba(255,255,255,0.35); font-family:'Cairo',sans-serif; font-size:14px; font-weight:500; border:1px solid rgba(255,255,255,0.08); cursor:pointer; }
        .pwa-btn-dismiss:hover { color:rgba(255,255,255,0.6); border-color:rgba(255,255,255,0.2); }
      `}</style>

      <div className="pwa-overlay" onClick={handleDismiss} />

      <div className="pwa-sheet">
        <div className="pwa-handle" />
        <div className="pwa-top">
          <div className="pwa-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <div className="pwa-texts">
            <h3>ثبّت التطبيق</h3>
            <p>أضف التطبيق إلى شاشتك الرئيسية للوصول السريع</p>
          </div>
        </div>

        <div className="pwa-name">جمعية نهضة العكنة الخيرية</div>

        {isIOS && (
          <div className="pwa-steps">
            <div className="pwa-step">
              <div className="pwa-step-num">١</div>
              <span className="pwa-step-text">اضغط أيقونة <strong>المشاركة</strong> (□↑) في الأسفل</span>
            </div>
            <div className="pwa-step">
              <div className="pwa-step-num">٢</div>
              <span className="pwa-step-text">اختر <strong>"إضافة إلى الشاشة الرئيسية"</strong></span>
            </div>
            <div className="pwa-step">
              <div className="pwa-step-num">٣</div>
              <span className="pwa-step-text">اضغط <strong>"إضافة"</strong> في الزاوية اليمنى</span>
            </div>
          </div>
        )}

        {!isIOS && (
          <button className="pwa-btn-install" onClick={handleInstall}>
            📲 تثبيت التطبيق الآن
          </button>
        )}

        <button className="pwa-btn-dismiss" onClick={handleDismiss}>
          ليس الآن
        </button>
      </div>
    </>
  )
}
