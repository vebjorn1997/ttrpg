import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="space-y-5" aria-busy>
      <span className="sr-only">Reading from the rules database…</span>

      <div className="border border-hairline bg-card/60 p-6">
        <Skeleton className="h-3 w-40 rounded-none" />
        <Skeleton className="mt-4 h-8 w-72 rounded-none" />
        <Skeleton className="mt-3 h-3 w-full max-w-2xl rounded-none" />
        <Skeleton className="mt-2 h-3 w-full max-w-xl rounded-none" />
      </div>

      <div className="border border-hairline bg-card/60 p-3">
        <Skeleton className="h-8 w-full max-w-xs rounded-none" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="border border-hairline bg-card/60 p-4">
            <Skeleton className="h-3 w-16 rounded-none" />
            <Skeleton className="mt-2 h-5 w-40 rounded-none" />
            <Skeleton className="mt-4 h-3 w-full rounded-none" />
            <Skeleton className="mt-2 h-3 w-4/5 rounded-none" />
          </div>
        ))}
      </div>
    </div>
  )
}
