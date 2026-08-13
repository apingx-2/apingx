type CheckoutPaymentStatusProps = {
  message: string;
};

export function CheckoutPaymentStatus({ message }: CheckoutPaymentStatusProps) {
  return (
    <section
      role="status"
      className="surface-panel rounded-sm border px-5 py-6 md:px-6"
    >
      <h1 className="type-section">Payment status</h1>
      <p className="type-body mt-4">{message}</p>
    </section>
  );
}
