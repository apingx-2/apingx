type AdminHeaderProps = {
  title: string;
  description: string;
};

export function AdminHeader({ title, description }: AdminHeaderProps) {
  return (
    <header className="border-b border-[var(--border-subtle)] pb-8">
      <p className="type-metadata">Archive / {title}</p>
      <h1 className="type-section mt-4">{title}</h1>
      <p className="type-body mt-4 max-w-3xl md:text-[0.9375rem]">
        {description}
      </p>
    </header>
  );
}
