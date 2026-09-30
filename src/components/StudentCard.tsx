import Link from 'next/link';
import { Student } from '@/types';

interface StudentCardProps {
  student: Student;
}

export default function StudentCard({ student }: StudentCardProps) {
  return (
    <div className="border rounded-lg p-5 shadow-sm hover:shadow-md transition bg-white flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-gray-900">{student.name}</h3>
          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded capitalize">
            {student.status}
          </span>
        </div>
        
        <p className="text-sm font-medium text-indigo-600 mb-1">{student.program}</p>
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{student.headline}</p>

        {student.availability && student.availability.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {student.availability.map((item) => (
              <span key={item} className="text-xs px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-full">
                {item}
              </span>
            ))}
          </div>
        )}

        {student.skills && student.skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {student.skills.slice(0, 4).map((skill) => (
              <span key={skill} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-800 rounded">
                {skill}
              </span>
            ))}
            {student.skills.length > 4 && (
              <span className="text-xs px-2 py-0.5 text-gray-500">
                +{student.skills.length - 4} more
              </span>
            )}
          </div>
        )}
      </div>

      <Link
        href={`/students/${student.id}`}
        className="mt-2 inline-block text-center w-full py-2 px-4 bg-indigo-600 text-white font-medium text-sm rounded hover:bg-indigo-700 transition"
      >
        View Profile
      </Link>
    </div>
  );
}
