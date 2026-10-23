import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getPublicStudent } from '@/lib/students';
import ProfileView from '@/components/ProfileView';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const student = await getPublicStudent(id).catch(() => null);
  return { title: student ? `${student.name} · ImmXrsive` : 'Profile not found · ImmXrsive' };
}

/** Stable public profile URL (R1.12). Unpublished or unknown ids show "not found" (R1.20, R1.21). */
export default async function StudentPage({ params }: Props) {
  const { id } = await params;
  const student = await getPublicStudent(id);
  if (!student) notFound();
  return (
    <div className="space-y-4">
      <Link href="/" className="text-sm font-semibold text-accent-dark underline">
        ← Back to directory
      </Link>
      <ProfileView student={student} />
    </div>
  );
}
