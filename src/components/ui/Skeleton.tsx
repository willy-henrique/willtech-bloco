import { cn } from '../../lib/cn';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-bg-muted', className)}
      aria-hidden
    />
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-4 p-4 md:p-6" aria-busy="true" aria-label="Carregando">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}
