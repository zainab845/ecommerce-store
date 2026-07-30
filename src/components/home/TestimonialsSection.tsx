const testimonials = [
  {
    name: 'Sarah Ahmed',
    role: 'Premium Member since 2024',
    avatar: 'S',
    color: 'bg-purple-100 text-purple-700',
    rating: 5,
    text: 'Absolutely love E-Shop! The quality of products is outstanding and the 10% Premium discount saves me money every single month. Delivery is always fast too.',
  },
  {
    name: 'Hassan Malik',
    role: 'Verified Customer',
    avatar: 'H',
    color: 'bg-blue-100 text-blue-700',
    rating: 5,
    text: 'The customer support team is incredibly helpful. Had an issue with an order and it was resolved within hours. Will definitely keep shopping here.',
  },
  {
    name: 'Ayesha Khan',
    role: 'Premium Member',
    avatar: 'A',
    color: 'bg-indigo-100 text-indigo-700',
    rating: 5,
    text: 'I upgraded to Premium last month and it has paid for itself already. The exclusive products and discounts are genuinely worth it.',
  },
  {
    name: 'Usman Tariq',
    role: 'Verified Customer',
    avatar: 'U',
    color: 'bg-green-100 text-green-700',
    rating: 4,
    text: 'Great selection of products across all categories. The checkout process is seamless and I love that I can track my orders easily.',
  },
  {
    name: 'Fatima Rizvi',
    role: 'Premium Member',
    avatar: 'F',
    color: 'bg-rose-100 text-rose-700',
    rating: 5,
    text: 'The refund process was so simple when one of my items arrived damaged. Full refund processed in days, no questions asked. Excellent service.',
  },
  {
    name: 'Ali Raza',
    role: 'Verified Customer',
    avatar: 'A',
    color: 'bg-amber-100 text-amber-700',
    rating: 5,
    text: 'Free shipping on everything is a game-changer. I order regularly and never have to worry about extra shipping costs eating into my budget.',
  },
];

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <svg key={s}
          className={`w-4 h-4 ${s <= count ? 'text-amber-400' : 'text-gray-200'}`}
          fill="currentColor" viewBox="0 0 24 24">
          <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ))}
    </div>
  );
}

export default function TestimonialsSection() {
  return (
    <section className="py-16 sm:py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-indigo-600 font-semibold text-sm uppercase tracking-widest mb-2">
            What customers say
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
            Loved by Thousands
          </h2>
          <div className="flex items-center justify-center gap-3 mt-4">
            <div className="flex -space-x-2">
              {['S','H','A','U','F'].map((letter, i) => (
                <div key={i} className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold ${testimonials[i].color}`}>
                  {letter}
                </div>
              ))}
            </div>
            <p className="text-gray-500 text-sm">
              <span className="font-bold text-gray-900">4.9/5</span> from 10,000+ reviews
            </p>
          </div>
        </div>

        {/* Testimonials grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${t.color}`}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.role}</p>
                  </div>
                </div>
                <svg className="w-7 h-7 text-indigo-100 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
              </div>
              <StarRating count={t.rating} />
              <p className="mt-3 text-gray-600 text-sm leading-relaxed">{t.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}