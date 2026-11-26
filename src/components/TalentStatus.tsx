import type { PublicStudent } from '@/lib/students';

const date = (d?: string) => (d ? new Date(`${d}T12:00:00`).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' }) : '');

/**
 * How a profile's availability is described to visitors (F.13, F.14).
 * Only Active Talent confirmed in the last year is shown as available.
 */
export default function TalentStatus({ student, compact = false, privateNote }: { student: PublicStudent; compact?: boolean; privateNote?: string }) {
  switch (student.talent) {
    case 'active':
      return (
        <span>
          {compact ? 'Open to: ' : 'Actively looking for: '}
          <span className="font-medium capitalize">{student.availability?.join(', ') || 'opportunities'}</span>
          {!compact && student.availability_confirmed_at && <span className="block text-xs opacity-75">Confirmed {date(student.availability_confirmed_at)}</span>}
        </span>
      );
    case 'stale':
      return (
        <span>
          Availability not confirmed since {date(student.availability_confirmed_at) || 'over a year ago'}
          {!compact && <span className="block text-xs opacity-75">It may be out of date, so it is not shown as current.</span>}
        </span>
      );
    case 'showcase':
      return <span>Showcase only{compact ? '' : ' – not looking for opportunities right now'}</span>;
    default:
      return <span>{privateNote ?? 'Availability not shown'}</span>;
  }
}
