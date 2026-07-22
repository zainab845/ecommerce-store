'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext'; // <-- 1. Import useAuth

export default function ContactPage() {
  const { user } = useAuth(); // <-- 2. Get the current user
  
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setForm({ name: '', email: '', subject: '', message: '' });
      } else {
        setError(data.error || 'Failed to send message');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-16 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900">Get in Touch</h1>
        <p className="text-gray-600 mt-3 text-lg">We'd love to hear from you</p>
      </div>

      {/* 3. Check for admin role before showing the form or success state */}
      {user?.role === 'admin' ? (
        <div className="text-center py-12 bg-amber-50 rounded-3xl border border-amber-100">
          <div className="text-5xl mb-4">🛡️</div>
          <h2 className="text-2xl font-semibold text-amber-800">Admin Account Detected</h2>
          <p className="text-amber-700 mt-3">Administrators cannot submit customer support inquiries.</p>
        </div>
      ) : success ? (
        <div className="text-center py-12 bg-green-50 rounded-3xl">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-semibold text-green-800">Message Sent!</h2>
          <p className="text-green-600 mt-3">We'll get back to you soon.</p>
          <button 
            onClick={() => setSuccess(false)}
            className="mt-6 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700"
          >
            Send Another Message
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input
              name="name"
              type="text"
              placeholder="Your Name"
              value={form.name}
              onChange={handleChange}
              className="px-5 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:border-indigo-400"
              required
            />
            <input
              name="email"
              type="email"
              placeholder="Your Email"
              value={form.email}
              onChange={handleChange}
              className="px-5 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:border-indigo-400"
              required
            />
          </div>

          <input
            name="subject"
            type="text"
            placeholder="Subject"
            value={form.subject}
            onChange={handleChange}
            className="w-full px-5 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:border-indigo-400"
          />

          <textarea
            name="message"
            rows={6}
            placeholder="Your Message"
            value={form.message}
            onChange={handleChange}
            className="w-full px-5 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:border-indigo-400 resize-y"
            required
          />

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-indigo-600 text-white font-semibold rounded-2xl hover:bg-indigo-700 transition-colors disabled:opacity-70"
          >
            {loading ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      )}
    </div>
  );
}