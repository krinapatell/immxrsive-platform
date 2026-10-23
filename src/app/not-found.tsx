import Link from 'next/link';

/** Useful not-found state for unknown or unpublished students/projects (R1.21). */
export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-line bg-white p-8 text-center">
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="mt-2 text-muted">This student or project doesn&apos;t exist or isn&apos;t public.</p>
      <Link href="/" className="mt-4 inline-block rounded-lg bg-accent px-4 py-2 font-semibold text-white hover:bg-accent-dark">
        Go to the talent directory
      </Link>
    </div>
  );
}
