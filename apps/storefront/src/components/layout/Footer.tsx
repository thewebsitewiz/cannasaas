import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-[#0a1a0f] text-white/40">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-sm font-black tracking-tighter text-white">
                GL
              </div>
              <span className="text-lg font-semibold text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                GreenLeaf
              </span>
            </div>
            <p className="text-sm leading-relaxed">
              Licensed cannabis dispensary. Curated products, tested for quality, delivered with care.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-xs font-semibold text-white/60 tracking-wider uppercase mb-4">Shop</h4>
            <ul className="space-y-2.5">
              {['Flower', 'Edibles', 'Vapes', 'Pre-Rolls', 'Concentrates', 'Topicals'].map((item) => (
                <li key={item}>
                  <Link href={`/products?category=${item.toLowerCase()}`} className="text-sm hover:text-white transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs font-semibold text-white/60 tracking-wider uppercase mb-4">Account</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'My Account', href: '/account' },
                { label: 'Order History', href: '/account' },
                { label: 'Loyalty Rewards', href: '/account' },
                { label: 'Sign In', href: '/login' },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-sm hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="text-xs font-semibold text-white/60 tracking-wider uppercase mb-4">Info</h4>
            <ul className="space-y-2.5 text-sm">
              <li>Mon–Sat: 10am – 9pm</li>
              <li>Sunday: 11am – 7pm</li>
              <li className="pt-2 text-white/60">
                21+ only. Valid ID required.
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/20">
            © {new Date().getFullYear()} GreenLeaf Dispensary. All rights reserved.
          </p>
          <p className="text-xs text-white/20">
            Powered by <span className="text-emerald-500/40">CannaSaas</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
