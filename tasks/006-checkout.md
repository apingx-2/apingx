# Task 006 – Checkout

| Property | Value |
|----------|-------|
| Task | 006 |
| Status | Ready for Implementation |
| Owner | CTO |
| Depends On | Tasks 001–005, Architecture 01–08 |
| Estimated Complexity | High |
| Estimated Duration | 2–3 Sessions |

---

# Product Intent

Task 006 establishes the first customer purchase flow in ApingX.

The objective is to allow a customer to select an active Product and proceed through a clear, trustworthy checkout experience using the Product’s canonical fiat price.

Checkout is a commercial transaction layer.

It must remain separate from:

- Collection publishing
- Solana minting
- Credential ownership
- reward distribution
- Chronicle progression

Task 006 should establish reliable commerce foundations without introducing hidden blockchain behaviour.

---

# Implementation Rule

Before implementation, read:

- `architecture/01-product-architecture.md`
- `architecture/02-system-architecture.md`
- `architecture/03-data-model.md`
- `architecture/04-credential-specification.md`
- `architecture/05-technical-decisions.md`
- `architecture/06-design-system.md`
- `architecture/07-component-library.md`
- `architecture/08-the-chronicle.md`
- `tasks/006-checkout.md`
- `prisma/schema.prisma`
- completed Task 004 Collection implementation
- completed Task 005 Product implementation

The existing architecture is authoritative.

Do not introduce blockchain logic in this task.

If the existing schema cannot support the minimum checkout workflow cleanly, stop and report the architectural gap before modifying the Prisma schema.

---

# Canonical Price

`Product.priceInPence` remains the authoritative Product price.

All checkout totals must derive from the persisted integer-pence value.

Do not:

- trust a client-supplied price
- recalculate canonical price from display strings
- store floating-point money values
- allow the browser to determine the final charge amount

The server must retrieve the Product and determine the payable amount.

---

# Future Crypto Price Presentation

The customer-facing Product and checkout experience should be designed so an indicative crypto equivalent can be introduced later.

Example:

`£85.00`
`≈ 0.42 SOL`

Important:

- GBP remains canonical.
- SOL is a display/payment representation only.
- Do not store SOL as a fixed Product price.
- Do not implement live SOL conversion in Task 006 unless explicitly authorised later in this task.
- Do not introduce price-feed APIs without CTO review.

Task 006 should not block future SOL or USDC payment options.

---

# Checkout Eligibility

Only Products with status:

`ACTIVE`

may proceed to checkout.

Products with status:

- `DRAFT`
- `SOLD_OUT`
- `ARCHIVED`

must not be purchasable.

The server must enforce this rule.

Do not rely on hidden buttons alone.

---

# Required Routes

Implement the minimum checkout flow under:

- `/checkout/[productId]`
- `/checkout/[productId]/success`

Do not create additional commerce routes unless required by this specification.

---

# Checkout Page

`/checkout/[productId]`

Purpose:

Present a final purchase summary before payment.

Display:

- Product name
- Collection identity
- Product image where present
- Product description summary
- canonical GBP price
- quantity fixed to 1 for Task 006
- final total
- payment action

Do not implement quantity selection in Task 006.

---

# Checkout Availability

If Product is not ACTIVE:

Do not display an actionable payment control.

Show a restrained availability message.

Examples:

- Product not currently available
- Product sold out
- Product archived

Do not expose internal status codes unnecessarily.

---

# Payment Provider

Use Stripe for fiat checkout.

Task 006 should establish a clean Stripe payment flow using the existing environment variables:

- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`

Use the current stable Stripe integration pattern compatible with the installed Stripe SDK.

Prefer Stripe Checkout Sessions unless the existing architecture explicitly requires Payment Elements.

Do not invent a custom card-processing UI.

---

# Stripe Amount Integrity

The server must:

1. receive Product identity
2. load Product from the database
3. verify Product is ACTIVE
4. read `priceInPence`
5. determine currency
6. create the Stripe payment request from trusted server data

Never accept authoritative amount or currency from the client.

---

# Checkout Session Metadata

Attach enough metadata to the Stripe transaction to identify:

- Product ID
- Collection ID
- Product slug
- Collection number where appropriate

Do not include secrets or unnecessary personal data.

Metadata should support future order reconciliation.

---

# Order Persistence

Task 006 must not invent an Order model unless one already exists.

If reliable checkout completion cannot be represented without persistent Order data:

STOP.

Report the architecture gap for CTO review.

Do not silently add:

- Order
- OrderItem
- Payment
- Customer
- Transaction

models.

This is a critical architecture boundary.

---

# Success Page

`/checkout/[productId]/success`

Purpose:

Confirm that the customer has returned from a successful Stripe-hosted payment flow.

The page may display:

- Product identity
- Collection identity
- acknowledgement of payment completion
- restrained next-step copy

Do not claim blockchain minting, Credential issuance, fulfilment, or reward processing has occurred.

Task 006 success means:

payment flow completed

not:

all downstream systems completed

---

# Payment Verification

Do not trust a query parameter such as:

`?success=true`

as proof of payment.

If Stripe Checkout is used, verify the returned Checkout Session server-side using Stripe before displaying a confirmed-payment state.

If verification fails:

show a neutral payment-status message.

Do not expose Stripe errors directly.

---

# Webhooks

If the existing architecture clearly requires Stripe webhooks for reliable payment confirmation, implement only the minimum secure webhook endpoint required.

If webhook handling would require persistent Order architecture that does not exist:

STOP and report the gap.

Do not create an incomplete financial ledger.

---

# Customer Information

Collect only the information required by the selected Stripe checkout flow.

Do not independently build customer profile storage in Task 006.

Do not persist unnecessary personal information.

Do not introduce a User ↔ checkout relationship unless already supported by architecture.

---

# Shipping

Task 006 does not implement custom shipping logic.

If Stripe Checkout requires shipping information for a physical Product, use Stripe-supported collection mechanisms only where appropriate.

Do not introduce:

- shipping tables
- carrier integrations
- fulfilment providers
- live delivery quotes

without architecture approval.

---

# Tax

Do not implement bespoke tax calculations.

Do not hard-code VAT logic.

If Stripe Tax is not already part of architecture, leave tax handling out of scope and report any production requirement separately.

---

# Product Presentation

Checkout should inherit the customer-facing design system.

It should feel:

- premium
- minimal
- trustworthy
- fashion-first
- crypto-aware but not crypto-dependent

It should not feel like:

- a generic Stripe demo
- a SaaS billing page
- a DeFi swap
- a blockchain explorer

---

# Crypto Payment Preparation

Task 006 should preserve room for future payment methods:

- SOL
- USDC on Solana

However, do not implement:

- wallet connection
- Solana Pay
- token transfer requests
- on-chain payment verification
- exchange-rate feeds
- crypto settlement
- crypto refunds

These belong to Task 007 or a later payment extension unless explicitly re-scoped.

---

# Error Handling

Handle:

- missing Product
- inactive Product
- database unavailable
- missing Stripe configuration
- Stripe session creation failure
- invalid or expired Checkout Session
- payment verification failure

Never expose:

- Stripe secret keys
- raw Prisma errors
- stack traces
- internal environment details

---

# Pending State

Creating a Checkout Session must communicate pending state.

Prevent repeated session creation from repeated button presses where practical.

Use restrained feedback.

---

# Accessibility

Ensure:

- checkout summary is semantically structured
- payment action is keyboard accessible
- focus states remain visible
- unavailable states are conveyed in text
- images have appropriate alt text
- mobile checkout is fully usable

---

# Responsive Behaviour

Checkout must work on mobile.

Important Product, Collection and price information must remain visible.

Do not hide the final total on smaller screens.

---

# Strictly Out of Scope

Do not implement:

- cart
- multiple Products per checkout
- quantity selection
- discount codes
- gift cards
- subscriptions
- customer accounts
- saved payment methods
- custom card fields
- custom payment processing
- inventory deduction
- stock reservation
- order management
- fulfilment
- shipping integrations
- returns
- refunds
- tax engine
- Product variants
- sizes
- Solana payments
- wallet connection
- Credential minting
- NFT creation
- reward distribution
- Chronicle progression
- analytics
- new database models without CTO approval

---

# Deliverables

Cursor must deliver:

- functional `/checkout/[productId]`
- Stripe-backed checkout initiation
- server-authoritative price handling
- ACTIVE Product eligibility enforcement
- secure Stripe Checkout Session creation
- verified success route
- premium checkout summary UI
- graceful unavailable/error states
- responsive behaviour
- architecture-gap report if persistent Order modelling becomes necessary

---

# Required Validation

Run:

`npx tsc --noEmit`

`npm run lint`

`npm run build`

Where Stripe test credentials are available, manually verify:

- ACTIVE Product can begin checkout
- DRAFT Product cannot
- SOLD_OUT Product cannot
- ARCHIVED Product cannot
- displayed GBP price matches Product record
- client cannot override charge amount
- Stripe Checkout Session is created from server data
- successful test payment returns to success page
- success page verifies Stripe session server-side
- invalid session does not show confirmed payment
- missing Stripe config fails gracefully
- mobile checkout remains usable

Do not claim Stripe manual verification unless valid test credentials were actually used.

---

# Architecture Stop Conditions

Stop implementation and report before proceeding if any of the following become necessary:

- new Order model
- new Payment model
- new Customer model
- inventory reservation
- webhook-backed financial ledger
- schema changes
- crypto price feed
- Solana payment implementation

These require CTO review.

---

## Checkout Completion Boundary

Task 006 success-page verification confirms the state of a returned Stripe Checkout Session for customer-facing acknowledgement only.

It is not the authoritative fulfilment mechanism.

Future fulfilment, inventory changes, Order persistence, Credential issuance, reward processing and payment reconciliation must be driven by server-side webhook processing against persistent commerce records.

The success page must never become the trigger for irreversible downstream business logic.

---

# Final Implementation Report

When finished, provide:

## Executive Summary

## Files Created

## Files Modified

## Routes

## Product Eligibility

## Stripe Integration

## Price Integrity

## Payment Verification

## Error Handling

## Architecture Stop Conditions Encountered

## Deviations

If none:

`No deviations from the Task 006 specification.`

## Automated Validation Results

Report exact results for:

- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`

## Manual Stripe Verification

Clearly state whether Stripe test mode was actually exercised.

## Git Status

Include:

`git status --short`

Do not stage, commit or push.






