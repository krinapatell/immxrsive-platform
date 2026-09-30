export default function StudentCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm animate-pulse flex flex-col justify-between h-[230px]">
      <div>
        <div className="flex justify-between items-start mb-2">
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          <div className="h-5 bg-gray-200 rounded-full w-14"></div>
        </div>
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6 mb-4"></div>
        <div className="flex gap-2">
          <div className="h-5 bg-gray-200 rounded-full w-16"></div>
          <div className="h-5 bg-gray-200 rounded-full w-16"></div>
        </div>
      </div>
      <div className="h-9 bg-gray-200 rounded w-full mt-4"></div>
    </div>
  );
}
