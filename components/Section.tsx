export function Section({
  eyebrow,
  title,
  children,
  className = ""
}: {
  eyebrow?: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`py-16 ${className}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {eyebrow && <p className="text-sm font-semibold uppercase tracking-wide text-gold">{eyebrow}</p>}
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-navy">{title}</h2>
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}
