"use client";

import { useState, useTransition } from "react";
import { createCheckoutSessionAction } from "@/lib/checkout/actions";

type CheckoutPaymentButtonProps = {
  productId: string;
};

export function CheckoutPaymentButton({
  productId,
}: CheckoutPaymentButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleCheckout() {
    setError(null);

    startTransition(async () => {
      const result = await createCheckoutSessionAction(productId);

      if (!result.success) {
        setError(result.error);
        return;
      }

      window.location.assign(result.url);
    });
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p
          role="alert"
          className="type-body rounded-sm border border-[var(--border-strong)] px-4 py-3"
        >
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={handleCheckout}
        disabled={isPending}
        aria-busy={isPending}
        className="focus-ring type-label w-full rounded-sm border border-[var(--border-strong)] px-4 py-3 text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-4)] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {isPending ? "Preparing secure checkout…" : "Proceed to payment"}
      </button>
    </div>
  );
}
