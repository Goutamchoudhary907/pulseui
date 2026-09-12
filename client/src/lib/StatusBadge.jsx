export default function StatusBadge({ status }) {
  const isAvailable = status === 'available';
  return (
    <span
      className={
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] ' +
        (isAvailable
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-stone-200 bg-stone-50 text-stone-500')
      }
    >
      <span
        className={
          'h-1 w-1 rounded-full ' + (isAvailable ? 'bg-emerald-500' : 'bg-stone-400')
        }
      />
      {isAvailable ? 'Available' : 'Soon'}
    </span>
  );
}
