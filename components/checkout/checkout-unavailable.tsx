type CheckoutUnavailableProps = {
  message: string;
};

export function CheckoutUnavailable({ message }: CheckoutUnavailableProps) {
  return (
    <section
      role="status"
      className="surface-panel rounded-sm border px-5 py-6 md:px-6"
    >
      <h2 className="type-label">Availability</h2>
      <p className="type-body mt-4">{message}</p>
    </section>
  );
}
