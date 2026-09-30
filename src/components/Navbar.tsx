import Link from 'next/link';

export default function Navbar() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-extrabold text-xl tracking-tight text-indigo-600">ImmXrsive</span>
          <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-semibold border border-indigo-100">
            Talent Platform
          </span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/" className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition">
            Directory
          </Link>
        </nav>
      </div>
    </header>
  );
}
