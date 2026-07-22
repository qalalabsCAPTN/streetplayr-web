export default function HomeLoading() {
  return (
    <div className="flex flex-col w-full gap-8 p-4 md:p-6 mx-auto max-w-[min(95vw,2400px)]">
      {/* Hero skeleton */}
      <div className="w-full aspect-[2/1] rounded-2xl bg-[#1b1620]/60 animate-pulse" />
      {/* Product section skeletons */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="w-full space-y-4">
          <div className="h-8 w-48 rounded bg-[#1b1620]/40 animate-pulse" />
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="aspect-[3/4] rounded-xl bg-[#1b1620]/40 animate-pulse" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
