'use client'
import { useRouter } from 'next/navigation'

export default function ContactPage() {
  const router = useRouter()

  const whatsappNumber = '218910000000' // ← غيّر الرقم هنا
  const phoneNumber = '+218910000000'   // ← غيّر الرقم هنا

  const whatsappLink = `https://wa.me/${whatsappNumber}?text=السلام عليكم، أود التواصل مع جمعية العكنة الخيرية`

  const contactMethods = [
    {
      icon: '📞',
      label: 'الاتصال المباشر',
      value: phoneNumber,
      desc: 'للتواصل والاستفسار',
      action: () => window.open(`tel:${phoneNumber}`),
      gradient: 'from-blue-600 to-blue-800',
      shadow: 'shadow-blue-200',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
    },
    {
      icon: '💬',
      label: 'واتساب',
      value: 'ابدأ محادثة مباشرة',
      desc: 'تواصل سريع عبر واتساب',
      action: () => window.open(whatsappLink, '_blank'),
      gradient: 'from-green-500 to-green-700',
      shadow: 'shadow-green-200',
      bg: 'bg-green-50',
      text: 'text-green-700',
    },
  ]

  const donationMethods = [
    { icon: '🏦', label: 'التحويل البنكي', desc: 'بنك الجمهورية — حساب رقم: XXXXXXXXXX' },
    { icon: '🤲', label: 'التبرع العيني', desc: 'يمكن تسليم التبرعات العينية مباشرة في مقر الجمعية' },
    { icon: '💵', label: 'التبرع النقدي', desc: 'يمكن التبرع نقداً بالتواصل مع أحد المسؤولين' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100" dir="rtl"
      style={{ fontFamily: "'Cairo', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet" />

      {/* الهيدر */}
      <div className="bg-gradient-to-l from-teal-800 via-teal-700 to-teal-600 text-white">
        <div className="max-w-lg mx-auto px-4 py-6 flex items-center justify-between">
          <button onClick={() => router.push('/home')}
            className="bg-white bg-opacity-20 text-black px-3 py-1.5 rounded-lg text-sm cursor-pointer hover:bg-opacity-30 transition-all">
            رجوع
          </button>
          <h1 className="text-lg font-bold">تواصل معنا</h1>
          <div className="w-16"></div>
        </div>

        {/* بانر علوي */}
        <div className="max-w-lg mx-auto px-4 pb-8 text-center">
          <div className="text-5xl mb-3">🤝</div>
          <p className="text-teal-100 text-sm leading-relaxed">
            نحن هنا للإجابة على استفساراتكم واستقبال تبرعاتكم الكريمة
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">

        {/* قسم التواصل */}
        <div>
          <h2 className="text-gray-700 font-bold text-base mb-3 flex items-center gap-2">
            <span className="w-1 h-5 bg-teal-500 rounded-full inline-block"></span>
            وسائل التواصل
          </h2>
          <div className="space-y-3">
            {contactMethods.map((method, i) => (
              <button key={i} onClick={method.action}
                className={`w-full bg-gradient-to-l ${method.gradient} text-white rounded-2xl p-5 flex items-center gap-4 shadow-lg ${method.shadow} hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer`}>
                <div className="w-14 h-14 bg-white bg-opacity-20 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">
                  {method.icon}
                </div>
                <div className="text-right flex-1">
                  <p className="text-lg font-bold">{method.label}</p>
                  <p className="text-sm opacity-80">{method.desc}</p>
                  <p className="text-xs opacity-70 mt-0.5 font-mono">{method.value}</p>
                </div>
                <span className="text-white opacity-60 text-xl">←</span>
              </button>
            ))}
          </div>
        </div>

        {/* قسم التبرع */}
        <div>
          <h2 className="text-gray-700 font-bold text-base mb-3 flex items-center gap-2">
            <span className="w-1 h-5 bg-teal-500 rounded-full inline-block"></span>
            طرق التبرع
          </h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {donationMethods.map((method, i) => (
              <div key={i}
                className={`p-4 flex items-start gap-4 ${i < donationMethods.length - 1 ? 'border-b border-gray-100' : ''}`}>
                <div className="w-11 h-11 bg-teal-50 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                  {method.icon}
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-sm">{method.label}</p>
                  <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{method.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* بطاقة واتساب بارزة */}
        <button onClick={() => window.open(whatsappLink, '_blank')}
          className="w-full bg-gradient-to-l from-green-600 to-green-500 text-white rounded-2xl p-5 flex items-center gap-4 shadow-lg shadow-green-200 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md">
            <svg viewBox="0 0 32 32" className="w-10 h-10" fill="none">
              <circle cx="16" cy="16" r="16" fill="#25D366"/>
              <path d="M22.5 9.5A9 9 0 0 0 7.2 20.3L6 26l5.9-1.5a9 9 0 0 0 10.6-15z" fill="white"/>
              <path d="M12.5 11.5c-.3-.7-.6-.7-.9-.7h-.8c-.3 0-.7.1-1 .5-.4.4-1.4 1.3-1.4 3.2s1.4 3.7 1.6 4c.2.2 2.8 4.4 6.9 6 .9.4 1.7.6 2.2.8.9.3 1.8.2 2.4-.1.7-.4 2.2-1.4 2.5-2.7.3-1.3.3-2.4.2-2.7-.1-.3-.5-.4-1-.7s-3-1.5-3.5-1.6c-.5-.2-.8-.3-1.2.3-.4.6-1.4 1.6-1.7 1.9-.3.3-.6.4-1.1.1-.5-.3-2.1-.8-4-2.5-1.5-1.3-2.5-3-2.7-3.5-.3-.5 0-.8.2-1 .2-.2.5-.6.7-.8.2-.3.3-.5.4-.8z" fill="#25D366"/>
            </svg>
          </div>
          <div className="text-right flex-1">
            <p className="text-lg font-bold">تواصل عبر واتساب</p>
            <p className="text-green-100 text-sm">اضغط للبدء في محادثة مباشرة</p>
          </div>
          <span className="text-white opacity-60 text-xl">←</span>
        </button>

        {/* معلومات إضافية */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🕐</span>
            <div>
              <p className="font-bold text-gray-800 text-sm">أوقات التواصل</p>
              <p className="text-gray-500 text-xs">من السبت إلى الخميس</p>
            </div>
          </div>
          <div className="bg-teal-50 rounded-xl p-3 text-center">
            <p className="text-teal-700 font-bold text-sm">8:00 ص — 10:00 م</p>
          </div>
        </div>

      </div>

      <footer className="text-center py-6 mt-4">
        <p className="text-gray-400 text-xs">© 2026 جمعية العكنة الخيرية</p>
      </footer>
    </div>
  )
}
