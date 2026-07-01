import Navbar from '@\components\layout\Navbar';
import Footer from '@\components\layout\Footer';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      {/* 'children' is the placeholder for your page content */}
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
}