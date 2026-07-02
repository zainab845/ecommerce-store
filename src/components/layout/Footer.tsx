import Link from 'next/link';

const footerLinks = {
  Shop: [
    { label: 'All Products', href: '/products' },
    { label: 'Categories', href: '/categories' },
  ],
  Account: [
    { label: 'Login', href: '/login' },
    { label: 'Sign Up', href: '/signup' },
    { label: 'Cart', href: '/cart' },
    { label: 'Wishlist', href: '/wishlist' },
  ],
  Company: [
    { label: 'Contact', href: '/contact' },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Brand */}
          <div>
            <span className="text-xl font-bold text-white tracking-tight">
               E-Shop<span className="text-indigo-400">.</span>
            </span>
            <p className="mt-3 text-sm leading-relaxed">
              Your one-stop destination for quality products at great prices.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                {title}
              </h3>
              <ul className="space-y-2">
                {links.map(link => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-8 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs">
            © {new Date().getFullYear()}  E-Shop. All rights reserved.
          </p>
          <div className="flex gap-4 text-xs">
            <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}