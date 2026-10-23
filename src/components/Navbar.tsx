import Link from 'next/link';

export default function Navbar() {
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-extrabold tracking-tight text-accent">ImmXrsive</span>
          <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent-dark">Talent Platform</span>
        </Link>
        <nav aria-label="Main" className="flex items-center gap-4 text-sm font-medium">
          <Link href="/" className="text-ink hover:text-accent">
            Talent directory
          </Link>
          <Link href="/student" className="rounded-lg bg-accent px-3 py-2 text-white hover:bg-accent-dark">
            Student portal
          </Link>
        </nav>
      </div>
    </header>
  );
}
