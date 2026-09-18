// Shared eyebrow + serif title + body used at the top of every homepage
// section, so the rhythm stays identical from section to section.
export default function SectionHeading({ eyebrow, title, body, align = 'left' }) {
  const centered = align === 'center';
  return (
    <div data-reveal className={centered ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      {eyebrow && (
        <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-stone-400">
          {eyebrow}
        </div>
      )}
      <h2 className="mt-4 font-display text-[38px] leading-[1.08] tracking-[-0.015em] text-ink sm:text-[46px]">
        {title}
      </h2>
      {body && (
        <p className="mt-5 text-[16.5px] leading-relaxed text-stone-600">{body}</p>
      )}
    </div>
  );
}
