


const Link = (props: any) => <a {...props} />;

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white pt-12 pb-8 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* 1. Brand Section */}
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="text-2xl font-bold text-white tracking-tight">
              E-Shop<span className="text-indigo-500">.</span>
            </Link>
            <p className="mt-4 text-gray-400 text-sm leading-relaxed">
              Your ultimate destination for premium products. Quality, affordability, and fast shipping all in one place.
            </p>
          </div>

          {/* 2. Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 border-b border-gray-700 pb-2 inline-block">E-Shop</h3>
            <ul className="space-y-3">
              <li><Link href="/products" className="text-gray-400 hover:text-white transition-colors">All Products</Link></li>
              <li><Link href="/categories" className="text-gray-400 hover:text-white transition-colors">Categories</Link></li>
              <li><Link href="/wishlist" className="text-gray-400 hover:text-white transition-colors">Your Wishlist</Link></li>
              <li><Link href="/cart" className="text-gray-400 hover:text-white transition-colors">Shopping Cart</Link></li>
            </ul>
          </div>

          {/* 3. Customer Service */}
          <div>
            <h3 className="text-lg font-semibold mb-4 border-b border-gray-700 pb-2 inline-block">Support</h3>
            <ul className="space-y-3">
              <li><Link href="/contact" className="text-gray-400 hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link href="/contact" className="text-gray-400 hover:text-white transition-colors">FAQ</Link></li>
              <li><Link href="/contact" className="text-gray-400 hover:text-white transition-colors">Shipping & Returns</Link></li>
              <li><Link href="/contact" className="text-gray-400 hover:text-white transition-colors">Track Order</Link></li>
            </ul>
          </div>

          {/* 4. Newsletter */}
          <div>
            <h3 className="text-lg font-semibold mb-4 border-b border-gray-700 pb-2 inline-block">Stay Updated</h3>
            <p className="text-gray-400 text-sm mb-4">Subscribe to our newsletter for the latest deals and updates.</p>
            <form className="flex flex-col space-y-2">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="px-4 py-2 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-gray-700"
                required
              />
              <button 
                type="button" 
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm text-center md:text-left">
            &copy; {new Date().getFullYear()}E-Shop. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <span className="text-gray-500 hover:text-white cursor-pointer transition-colors">FB</span>
            <span className="text-gray-500 hover:text-white cursor-pointer transition-colors">IG</span>
            <span className="text-gray-500 hover:text-white cursor-pointer transition-colors">TW</span>
          </div>
        </div>
      </div>
    </footer>
  );
}