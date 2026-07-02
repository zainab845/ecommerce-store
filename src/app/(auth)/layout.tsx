import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 relative">
      {/* The Back Button requested in Task 1.6 */}
      <div className="absolute top-6 left-6">
        <Link href="/" className="text-blue-600 hover:underline font-medium">
          &larr; Back to Home
        </Link>
      </div>
      
      {/* This renders your login or signup page content */}
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded shadow-md">
        {children}
      </div>
    </div>
  );
}