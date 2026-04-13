'use client'
import { useRouter } from 'next/navigation'

export default function ContactPage() {
  const router = useRouter()

  const whatsappNumber = '218910000000'
  const phoneNumber = '+218910000000'
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=السلام عليكم، أود التواصل مع جمعية العكنة الخيرية`

  const donationMethods = [
    {
      label: 'التحويل البنكي',
      desc: 'بنك الجمهورية — حساب رقم: XXXXXXXXXX',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="#0d7a60" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
        </svg>
      ),
    },
    {
      label: 'التبرع العيني',
      desc: 'يمكن تسليم التبرعات مباشرة في مقر الجمعية',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="#0d7a60" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      ),
    },
    {
      label: 'التبرع النقدي',
      desc: 'بالتواصل مع أحد المسؤولين عبر الهاتف أو واتساب',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="#0d7a60" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-[#f7f5f0] font-cairo" dir="rtl" style={{ fontFamily: "'Cairo', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* Header */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a5c47 0%, #0d7a60 50%, #0f8c6e 100%)' }}>
        <div className="absolute -top-10 -left-10 w-44 h-44 bg-white/5 rounded-full" />
        <div className="absolute -bottom-5 -right-5 w-28 h-28 bg-white/5 rounded-full" />

        <div className="relative z-10 max-w-lg mx-auto px-5 pt-4 pb-8">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => router.push('/home')}
              className="bg-white/15 border border-white/20 text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-white/25 transition-all cursor-pointer"
            >
              ← رجوع
            </button>
            <h1 className="text-white text-[17px] font-bold">تواصل معنا</h1>
            <div className="w-[72px]" />
          </div>

          
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

        {/* Contact Methods */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-[3px] h-5 rounded-full" style={{ background: '#0d7a60' }} />
            <span className="text-sm font-bold text-gray-900">وسائل التواصل</span>
          </div>
          <div className="space-y-2.5">

            

            {/* WhatsApp */}
            <button
              onClick={() => window.open(whatsappLink, '_blank')}
              className="w-full rounded-[18px] overflow-hidden cursor-pointer hover:-translate-y-0.5 active:scale-[0.97] transition-all shadow-lg"
              style={{ background: 'linear-gradient(135deg, #1a7a3a 0%, #22a04d 100%)' }}
            >
              <div className="flex items-center gap-4 p-[18px_20px]">
                <div className="w-[52px] h-[52px] bg-white/20 rounded-[14px] flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" fill="white" className="w-[26px] h-[26px]">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                    <path d="M11.99 2C6.469 2 2 6.468 2 12c0 1.99.517 3.857 1.426 5.479L2.05 22l4.637-1.358A9.945 9.945 0 0 0 11.99 22c5.522 0 9.99-4.468 9.99-9.99C21.98 6.468 17.512 2 11.99 2z" />
                  </svg>
                </div>
                <div className="flex-1 text-right">
                  <p className="text-white text-base font-bold">واتساب</p>
                  <p className="text-white/75 text-xs mt-0.5">تواصل سريع ومباشر</p>
                  <p className="text-white/60 text-[11px] mt-0.5">ابدأ محادثة الآن</p>
                </div>
                <span className="text-white/50 text-lg">←</span>
              </div>
            </button>

          </div>
        </div>

        {/* Donation Methods */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-[3px] h-5 rounded-full" style={{ background: '#0d7a60' }} />
            <span className="text-sm font-bold text-gray-900">طرق التبرع</span>
          </div>
          <div className="bg-white rounded-[18px] overflow-hidden shadow-sm border border-black/[0.06]">
            {donationMethods.map((item, i) => (
              <div key={i} className={`flex items-start gap-3.5 p-4 ${i < donationMethods.length - 1 ? 'border-b border-black/[0.06]' : ''}`}>
                <div className="w-[42px] h-[42px] bg-[#eaf6f1] rounded-[12px] flex items-center justify-center shrink-0">
                  {item.icon}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-800 mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hours */}
        <div className="bg-white rounded-[18px] p-[18px] shadow-sm border border-black/[0.06] flex items-center gap-3.5">
          <div className="w-11 h-11 bg-[#fff8e8] rounded-[12px] flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="#c8880a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px]">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className="flex-1 text-right">
            <p className="text-sm font-bold text-gray-900">أوقات التواصل</p>
            <p className="text-xs text-gray-800 mt-0.5">من السبت إلى الخميس</p>
          </div>
          <div className="bg-[#eaf6f1] text-[#0d7a60] text-sm font-bold px-3.5 py-1.5 rounded-[10px]">
            8ص — 10م
          </div>
        </div>

      </div>

      <footer className="text-center pb-6">
        <p className="text-xs text-black-300">جميع الحقوق محفوظة © جمعية نهضة العكنة الخيرية</p>
      </footer>
    </div>
  )
}