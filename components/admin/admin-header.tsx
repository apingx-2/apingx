type AdminHeaderProps = {
  title: string;
  description: string;
};

export function AdminHeader({ title, description }: AdminHeaderProps) {
  return (
    <header className="border-b border-[var(--admin-border)] pb-6">
      <p className="text-[11px] font-semibold tracking-[0.2em] text-[var(--admin-text-muted)] uppercase">
        Admin / {title}
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-[var(--admin-text-primary)] md:text-4xl">
        {title}
      </h1>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[var(--admin-text-secondary)] md:text-base">
        {description}
      </p>
    </header>
  );
}
