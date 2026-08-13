export default function CheckoutLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="admin-theme min-h-screen bg-[var(--surface-0)]">
      <main className="mx-auto max-w-2xl px-4 py-8 md:px-6 md:py-12">
        {children}
      </main>
    </div>
  );
}
