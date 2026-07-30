const stats = [
  { value: '10K+', label: 'Happy Customers', icon: '😊' },
  { value: '500+', label: 'Products', icon: '📦' },
  { value: '99%', label: 'Satisfaction Rate', icon: '⭐' },
  { value: '24/7', label: 'Customer Support', icon: '💬' },
];

export default function StatsSection() {
  return (
    <section className="bg-indigo-600 py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map(stat => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className="text-3xl sm:text-4xl font-extrabold text-white">{stat.value}</div>
              <div className="text-indigo-200 text-sm mt-1 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}