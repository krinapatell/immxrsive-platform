import Link from 'next/link';

export default function StaffNav({ back = true }: { back?: boolean }) {
  return back ? (
    <Link href="/staff" className="text-sm font-semibold text-accent-dark underline">
      ← Staff home
    </Link>
  ) : null;
}
