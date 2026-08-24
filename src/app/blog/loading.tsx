export default function BlogLoading() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50">
      <div className="relative z-10">
        {/* Header Skeleton */}
        <div className="hidden border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10 md:block">
          <div className="container mx-auto px-4 py-6">
            <div className="h-8 w-24 bg-slate-200 animate-pulse rounded"></div>
            <div className="h-4 w-48 bg-slate-200 animate-pulse rounded mt-2"></div>
          </div>
        </div>

        {/* Top Buttons Skeletons */}
        <div className="absolute top-6 left-6 z-50">
          <div className="h-9 w-32 bg-slate-200/50 animate-pulse rounded-full"></div>
        </div>
        <div className="absolute top-6 right-6 z-50 hidden sm:block">
          <div className="h-10 w-40 bg-slate-200/50 animate-pulse rounded-xl"></div>
        </div>

        {/* Content Skeleton */}
        <div className="container mx-auto px-4 md:px-[150px] pt-[100px] pb-[25px]">
          {/* Search Bar Skeleton */}
          <div className="mb-6 flex gap-4">
            <div className="h-12 flex-1 bg-white border border-slate-200 animate-pulse rounded-2xl"></div>
            <div className="h-12 w-24 bg-slate-200 animate-pulse rounded-2xl"></div>
          </div>

          <div className="bg-white rounded-[12px] p-[3px] shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 p-4">
              {/* Hero Carousel Skeleton (takes 2 columns) */}
              <div className="col-span-1 sm:col-span-2 xl:col-span-2 min-h-[224px] bg-slate-100 animate-pulse rounded-xl"></div>
              
              {/* Cards Skeletons */}
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex flex-col h-[224px] bg-slate-50 border border-slate-100 rounded-xl overflow-hidden animate-pulse">
                  <div className="h-24 bg-slate-200 w-full flex-shrink-0"></div>
                  <div className="p-3 flex-1 flex flex-col gap-2">
                    <div className="h-3 w-1/2 bg-slate-200 rounded"></div>
                    <div className="h-4 w-full bg-slate-200 rounded mt-1"></div>
                    <div className="h-4 w-3/4 bg-slate-200 rounded"></div>
                    <div className="mt-auto pt-2 border-t border-slate-100 flex justify-between">
                      <div className="h-3 w-8 bg-slate-200 rounded"></div>
                      <div className="h-3 w-8 bg-slate-200 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
