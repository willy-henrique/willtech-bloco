import { cn } from '../../lib/cn';

export function Avatar({
  name,
  src,
  className,
}: {
  name: string;
  src?: string;
  className?: string;
}) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <div
      className={cn(
        'inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-border bg-accent-soft text-sm font-bold text-accent',
        className,
      )}
      aria-hidden={!src}
    >
      {src ? (
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <span>{initials || 'WT'}</span>
      )}
    </div>
  );
}
