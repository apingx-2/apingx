# Task 008 – Distribution Engine

| Property             | Value                                             |
| -------------------- | ------------------------------------------------- |
| Task                 | 008                                               |
| Status               | Ready for Implementation                          |
| Owner                | CTO                                               |
| Depends On           | Tasks 001–007, Architecture 01–08                 |
| Estimated Complexity | High                                              |
| Estimated Duration   | 2–3 Sessions                                      |
| Settlement           | Out of Scope                                      |
| Regulatory Position  | Contributor compensation, not passive token yield |

---

# Product Intent

Task 008 establishes the off-chain compensation eligibility and distribution-calculation engine for ApingX Contributors.

The objective is to determine, in an auditable and reproducible way:

* whether a Contributor has satisfied the requirements for a defined Contribution Period
* which contractual allocation applies
* what compensation amount is calculated from an approved distributable amount

Task 008 does **not** move money.

It does not:

* transfer SOL
* transfer USDC
* initiate bank payments
* trigger Stripe payouts
* execute crypto settlement

It calculates and records entitlement eligibility and compensation for later approval and settlement.

---

# Core Regulatory Principle

Credential ownership alone does not create compensation entitlement.

The intended relationship is:

Contributor Agreement

* verified contribution
* applicable allocation
* qualifying Contribution Period
  → compensation eligibility

The Credential records provenance and participation.

It is not itself the contractual source of payment rights.

Transfer of a Credential must not automatically transfer contractual compensation rights.

Task 008 must preserve this separation throughout the data model and interface.

---

# Securities-Law Design Boundary

Task 008 must not implement a passive yield model.

Do not build:

Credential ownership
→ automatic revenue share
→ automatic payout

Do not use investment-oriented language including:

* yield
* dividend
* ROI
* passive income
* investment return
* profit token
* staking reward

Preferred language:

* contributor compensation
* allocation
* contribution requirement
* contribution evidence
* eligibility
* approved distributable amount
* calculated compensation
* settlement

This architecture is intended to support genuine compensation for qualifying work.

It is not a substitute for legal advice.

---

# Implementation Rule

Before implementation, read in full:

* `architecture/01-product-architecture.md`
* `architecture/02-system-architecture.md`
* `architecture/03-data-model.md`
* `architecture/04-credential-specification.md`
* `architecture/05-technical-decisions.md`
* `architecture/06-design-system.md`
* `architecture/07-component-library.md`
* `architecture/08-the-chronicle.md`
* `tasks/008-distribution-engine.md`
* `prisma/schema.prisma`
* completed Tasks 004–007 implementations

The architecture documents are authoritative.

If Task 008 requires new persistent models, stop and report the required schema design before implementing migrations.

Do not invent financial persistence silently.

From Task 008 onward, Prisma migrations under `prisma/migrations/` are version-controlled. Persistent schema changes must use migrations (`prisma migrate dev` / `prisma migrate deploy`). `prisma db push` is not the shared or deployment schema workflow.

---

# Existing Allocation Rule

The existing Credential field:

`allocationBasisPoints`

represents the contractual allocation used in compensation calculations.

10,000 basis points = 100%.

Example:

500 basis points = 5%.

This field is:

* ApingX business logic
* not a marketplace royalty
* not Metaplex seller fee
* not an NFT yield rate
* not proof of automatic entitlement

Allocation is applied only after the Contributor has been determined eligible for the relevant Contribution Period.

---

# Contributor Agreement Principle

A Contributor Agreement exists conceptually outside the Credential.

Task 008 should assume that compensation rights originate from an agreement between ApingX and the Contributor.

The Credential may provide evidence of:

* contribution
* Collection relationship
* provenance
* allocation reference

The Credential itself must not be treated as the legal agreement.

Do not make NFT ownership the determinant of contractual compensation.

---

# Contribution Period

Compensation eligibility must be evaluated for a defined Contribution Period.

Examples:

* Collection 001 / Launch Period
* Collection 001 / Q4 2026
* Collection 002 / Campaign Period

A Contribution Period should represent a meaningful compensation cycle.

It must have:

* identity
* Collection relationship
* title
* start date
* end date
* review status
* distributable amount where approved
* calculation state

Do not use indefinite lifetime eligibility.

---

# Contribution Requirements

Each Contribution Period may contain one or more Contribution Requirements.

Requirements represent real services or activities expected from Contributors.

Examples include:

* promotional activity
* social content
* photography
* design work
* modelling
* campaign participation
* community activity
* event participation
* partnership development
* editorial contribution
* approved creative deliverables

Do not hard-code Twitter/X into the architecture.

Requirements should remain platform-neutral.

---

# Contribution Period Participation

Participation in a Contribution Period must be explicit.

ApingX must not automatically treat every Contributor or Credential associated with a Collection as participating in that Period.

A Contributor enters a Contribution Period only when ApingX deliberately records:

* the Contribution Period
* the Contributor
* the Credential used as the applicable allocation/provenance reference
* an optional Contributor Agreement reference

The Credential is an allocation reference.

It is not the source of entitlement.

The Contributor remains the compensated party.

The architecture must therefore support an explicit Contribution Period participant relationship.

Preferred conceptual structure:

`ContributionPeriodParticipant`

The exact model name may vary, but the relationship must preserve the same meaning.

---

# Multiple Credentials Per Contributor

A Contributor may hold or be associated with more than one Credential.

Task 008 must not assume:

`one Contributor = one Credential`

A Contribution Period may therefore contain multiple allocation references for the same Contributor.

Example:

Contributor Alice:

* Credential 001 — 300 bps
* Credential 004 — 200 bps

The calculation engine should be capable of preserving each allocation reference independently.

Contributor-level totals may be presented as an aggregation of those calculation lines.

Historical calculation records must preserve the Credential/allocation reference used for each line.

---

# Participant and Credential Validation

When a Contributor is assigned to a Contribution Period:

* the Contributor must exist
* the Credential must exist
* `Credential.contributorId` must match the selected Contributor
* the Credential must belong to the same Collection as the Contribution Period
* Founder Credentials without a Contributor are not eligible unless explicitly associated with a Contributor through an approved future business process

Do not infer compensation entitlement from:

* mint address
* current owner wallet
* current NFT holder
* secondary-market transfer

---

# Eligibility Semantics

Live eligibility is derived.

While a Contribution Period is `OPEN`:

* all requirements satisfied → `QUALIFIED`
* any unmet requirement → `PENDING`
* rejected evidence does not automatically mean `NOT_QUALIFIED` while the Period remains open because replacement evidence may still be submitted

When a Contribution Period is `CLOSED`:

* all requirements satisfied → `QUALIFIED`
* any unmet requirement → `NOT_QUALIFIED`

Historical eligibility is snapshotted when a Distribution Calculation is created.

Approved calculation eligibility must never be recomputed from later evidence.

---

# Rounding Policy — distribution-v1

Task 008 uses deterministic integer arithmetic.

For calculation version:

`distribution-v1`

positive fractional-penny results are truncated downward.

Conceptually:

`floor(distributableAmountInPence × allocationBasisPoints / 10,000)`

Do not use floating-point arithmetic.

Use integer or BigInt arithmetic.

Any fractional-penny remainder remains part of the unallocated amount.

Do not redistribute rounding remainder automatically.

---

# Calculation-Line Identity

A Distribution Calculation must preserve each explicit Contribution Period participant/allocation reference independently.

Do not enforce one calculation line per Contributor if a Contributor may have multiple Credentials.

Preferred conceptual relationship:

`DistributionCalculationLine → ContributionPeriodParticipant`

A Contributor's total compensation may be derived by summing their applicable calculation lines.

Each line must retain historical snapshots including:

* Contributor
* Credential
* Collection
* allocation basis points
* eligibility
* distributable amount
* calculated compensation
* requirement audit

---

# Calculation Timing

Persisted Distribution Calculations may only be created when the Contribution Period is `CLOSED`.

While a Contribution Period is `OPEN`, the Admin interface may display a non-persisted calculation preview using current eligibility and allocation data.

An OPEN-period preview is informational only.

It must not:

- create a DistributionCalculation
- create DistributionCalculationLine records
- snapshot eligibility
- create an approvable financial record

Closing the Contribution Period finalises live eligibility for the purpose of creating a historical Distribution Calculation.

Once CLOSED, the Period must not return to OPEN through normal Task 008 workflows.
---

# Delete Safety

Audit-critical financial calculation records must fail safe.

Do not rely on conditional database cascade behaviour that depends on application status.

Use restrictive database relationships for:

* approved calculations
* void calculations
* calculation lines
* evidence records

Draft cleanup may be performed explicitly by application logic where permitted.

Approved and void historical calculation records must never be hard-deleted through normal application workflows.

---

# Replacement Calculation Chain

Corrections to an approved calculation must preserve history.

Preferred sequence:

`Calculation 1 → VOID`

then:

`Calculation 2 → APPROVED`

If Calculation 2 later requires correction:

`Calculation 2 → VOID`

then:

`Calculation 3 → APPROVED`

Each calculation may have at most one immediate replacement.

Do not allow multiple competing replacements of the same historical calculation.

---

# Contributor Agreement Reference

Task 008 does not introduce a full Contributor Agreement model.

However, explicit Contribution Period participation may store an optional:

`agreementReference`

This may later identify:

* contract version
* signed agreement reference
* external agreement identifier

The value is informational only in Task 008.

Do not implement contract storage, signatures, document uploads, or legal-document management in this task.

---

# Promotional Requirements

Where promotional activity is required, the system may record requirements such as:

`Three approved promotional activities`

rather than:

`Three tweets`

Evidence may later contain links from:

* X
* Instagram
* TikTok
* YouTube
* publications
* websites
* other approved platforms

Task 008 must not automatically scrape or evaluate social media.

Manual submission and verification is sufficient.

---

# Financial Promotion Safety

Task 008 must not encourage Contributors to make investment claims about Credentials or cryptoassets.

Promotional requirements should focus primarily on:

* Collection
* physical Products
* ApingX archive
* creative campaign
* provenance story

Do not require Contributors to promote:

* passive income
* expected investment return
* token appreciation
* guaranteed revenue
* speculative NFT value

Promotional evidence is proof that agreed work occurred, not proof that a financial promotion was made.

---

# Contribution Evidence

Contributors must be able to provide evidence that a requirement was completed.

Evidence may include:

* URL
* textual note
* external reference

Do not implement file uploads in Task 008 unless already supported by architecture.

Evidence should identify:

* Contributor
* Contribution Period
* Requirement
* submitted evidence
* submission date
* review state

---

# Evidence Review

Evidence must be reviewed by ApingX.

Allowed review outcomes:

* PENDING
* VERIFIED
* REJECTED

Do not automatically grant compensation eligibility merely because a URL was submitted.

Verification is an explicit administrative action.

---

# Evidence Immutability

Once Contribution Evidence has been VERIFIED, it must not be silently edited.

Corrections must be represented by new evidence or an explicit future correction mechanism that preserves the historical record.

Task 008 must not rewrite verified historical evidence.

---

# Eligibility

A Contributor is eligible for compensation for a Contribution Period only when all required eligibility conditions are satisfied.

At minimum:

* Contributor exists
* applicable Credential exists
* Contributor is contractually associated with the allocation
* required contributions are verified
* Contribution Period is approved for calculation

Credential ownership on Solana is not sufficient.

Do not determine eligibility from `currentOwnerWallet`.

Do not determine eligibility from current NFT owner.

---

# Credential Transfer

Credential transfer must not automatically transfer compensation rights.

If an NFT is transferred:

* provenance ownership may change on-chain
* contractual Contributor compensation remains associated with the relevant Contributor Agreement unless separately reassigned through an approved legal/business process

Task 008 must not implement compensation-right transfer.

Do not calculate compensation for a secondary-market Credential buyer solely because they own the NFT.

---

# Distribution Calculation

Compensation must be calculated using integer arithmetic.

The conceptual formula is:

`distributableAmount × allocationBasisPoints / 10,000`

Example:

Distributable amount:

`£8,500.00`

Stored as:

`850000 pence`

Allocation:

`500 bps`

Calculation:

`850000 × 500 / 10000`

Result:

`42500 pence`

Displayed as:

`£425.00`

Do not use floating-point persistence.

---

# Rounding

Task 008 must define deterministic rounding.

Prefer integer division only where mathematically exact.

If division produces a remainder, the engine must use one documented rounding rule.

Do not silently use JavaScript floating-point rounding.

If the appropriate financial rounding policy is ambiguous, stop and report it for CTO review.

---

# Distributable Amount

The distributable amount is an approved business input.

Task 008 does not derive distributable revenue automatically from Stripe transactions.

The Admin must provide or approve the amount used for the Contribution Period.

Examples may conceptually include:

* approved campaign compensation pool
* approved Collection compensation pool
* other contractually defined amount

Do not implement:

Stripe revenue
→ automatic distribution pool

No automatic revenue accounting exists yet.

---

# Currency

Task 008 should use GBP only unless existing architecture explicitly says otherwise.

Store monetary amounts as integer pence.

Do not introduce:

* SOL-denominated compensation
* USDC-denominated compensation
* exchange rates
* multi-currency calculations

Settlement currency may be introduced later.

---

# Historical Snapshot Principle

Historical compensation calculations must remain reproducible.

A completed calculation must not dynamically depend on mutable future state.

Example:

At calculation time:

* Contributor: Alice
* Credential: 001
* allocation: 500 bps
* distributable amount: £8,500
* eligibility: QUALIFIED
* calculated compensation: £425

If the Credential allocation later changes, the historical calculation must continue to show:

`500 bps`

not the new value.

Task 008 therefore requires snapshot-style persistence for approved calculations.

---

# Calculation Snapshot

A historical calculation should preserve at least:

* Contribution Period
* Contributor
* Credential reference
* Collection reference
* allocation basis points applied
* distributable amount
* calculated compensation
* eligibility state
* calculation timestamp
* calculation version
* approval state

Do not rely on current Credential state when displaying historical calculations.

---

# Calculation Version

Introduce a simple calculation version identifier.

Example:

`distribution-v1`

The purpose is auditability.

If calculation logic changes in future tasks, historical records must still identify which logic produced them.

Do not create a complex rules engine.

---

# Approval Workflow

A calculated compensation record should move through restrained administrative states.

Preferred conceptual states:

* DRAFT
* CALCULATED
* APPROVED
* VOID

Do not introduce:

* PAID
* SETTLED
* FAILED_PAYMENT

because Task 008 does not execute settlement.

Settlement status belongs to a future task.

---

# Recalculation

Before approval:

an Admin may recalculate if Contribution Period inputs or eligibility change.

After approval:

the historical calculation should be treated as locked.

Do not silently mutate an approved calculation.

If a correction is necessary, prefer:

* VOID existing calculation
* create replacement calculation

rather than rewriting history.

---

# Auditability

Every approved compensation result must be explainable.

The UI should make it possible to answer:

* Which Contribution Period?
* Which Contributor?
* Which Credential?
* Which Collection?
* Which requirements were verified?
* What distributable amount was used?
* What allocation was applied?
* What calculation formula was used?
* What compensation amount resulted?
* When was it calculated?
* Which calculation version produced it?

Do not hide calculation logic.

---

# Required Admin Routes

The exact routes may depend on the schema design approved for Task 008.

Preferred conceptual routes:

* `/admin/distributions`
* `/admin/distributions/new`
* `/admin/distributions/[id]`

Potential Contribution Period administration may live under:

* `/admin/distributions/periods`
* `/admin/distributions/periods/[id]`

Do not create routes until persistence requirements have been reviewed.

If the existing schema lacks required models, stop before route implementation and provide a schema proposal.

---

# Required Schema Review

Task 008 will likely require persistent models that do not currently exist.

Potential concepts include:

* ContributionPeriod
* ContributionPeriodParticipant
* ContributionRequirement
* ContributionEvidence
* ContributorEligibility
* DistributionCalculation
* DistributionCalculationLine

Cursor must first inspect the existing Prisma schema.

If equivalent models do not already exist:

STOP IMPLEMENTATION.

Provide a proposed schema design for CTO review.

Do not modify `prisma/schema.prisma` until approved.

---

# Schema Design Principles

Any proposed models must preserve:

* Contributor as the compensated party
* Credential as provenance/allocation reference
* Collection relationship
* Contribution Period isolation
* evidence verification
* historical calculation snapshots
* integer-pence amounts
* basis-point snapshots
* no dependence on current NFT owner
* no automatic settlement

Avoid excessive future-proofing.

Model only what Task 008 genuinely needs.

---

# Credential Relationship

A Distribution Calculation must reference the explicit Contribution Period participant/allocation relationship, which in turn identifies the Contributor and Credential used for that calculation

However:

Credential ownership is not compensation entitlement.

The calculation must identify the Contributor separately.

Do not design:

`credentialId → current owner → compensation`

Design:

`Contributor + agreement/eligibility + Credential allocation reference → compensation`

---

# Solana Ownership

Task 008 does not require Solana ownership verification before calculating Contributor compensation.

On-chain ownership is provenance data.

Compensation eligibility comes from:

* Contributor relationship
* Contribution Period
* verified contribution
* contractual allocation

Do not block compensation because a Contributor transferred the NFT.

Do not grant compensation to a new NFT owner automatically.

---

# Contributor Selection

Admins should select Contributors using human-readable identity.

Do not expose raw Contributor IDs as the main interface.

Where relevant display:

* Contributor display name
* Collection
* Credential number
* allocation basis points

---

# Requirement Assignment

Contribution Requirements may apply:

* to all Contributors in a Contribution Period
* or to individual Contributors

Keep implementation restrained.

If supporting both substantially complicates the schema, stop and propose the simplest suitable Task 008 model.

---

# Evidence Submission

Task 008 is primarily an Admin workflow.

Do not build a public Contributor portal unless already present in architecture.

For Task 008, Admin may enter evidence on behalf of a Contributor.

Future Contributor self-service belongs to another task.

---

# Eligibility Review

Admin must be able to determine whether a Contributor has qualified.

The interface should show:

* requirements
* submitted evidence
* verification status
* overall eligibility

Preferred overall derived states:

* PENDING
* QUALIFIED
* NOT_QUALIFIED

Avoid creating persistent state when it can be safely derived, unless snapshot auditability requires persistence.

---

# Calculation Preview

Before creating an approved historical calculation, show a preview.

Example:

Contributor: Alice
Credential: CREDENTIAL 001
Collection: COLLECTION 001
Allocation: 500 bps (5.00%)
Approved distributable amount: £8,500.00
Calculated compensation: £425.00

The interface should make the arithmetic obvious.

---

# Distribution Totals

The Admin interface should display:

* total distributable amount
* total calculated Contributor compensation
* unallocated remainder

Do not assume allocations total 10,000 bps.

If total eligible allocation exceeds 10,000 bps:

block approval and show a clear validation error.

If total allocation is below 10,000 bps:

allow it, but show the unallocated remainder clearly.

---

# Allocation Validation

Task 008 must validate:

* allocation >= 0
* allocation <= 10,000
* total eligible allocation <= 10,000

Use integer basis points.

Do not use floating percentages for authoritative calculation.

---

# Ineligible Contributors

If a Contributor is not eligible:

their allocation must not automatically be redistributed to other Contributors.

Example:

Alice: 500 bps — QUALIFIED
Bob: 500 bps — NOT_QUALIFIED

Do not silently convert Alice to 1,000 bps.

The unallocated amount remains unallocated unless a separate approved business decision changes the Contribution Period.

---

# No Automatic Settlement

Approval does not move funds.

Task 008 must not:

* send bank transfers
* call Stripe Connect
* initiate Stripe payouts
* transfer SOL
* transfer USDC
* transfer SPL tokens
* sign payment transactions

The output is an approved compensation record only.

---

# No Stripe Revenue Integration

Do not query Stripe transactions to calculate the pool.

Task 006 confirms payments.

It does not yet provide an Order/financial ledger sufficient for audited compensation accounting.

Any future Stripe revenue integration requires persistent commerce/accounting architecture.

---

# No Solana Payment Integration

Do not use the Credential owner's Solana wallet as a payment destination.

Do not initiate blockchain transfers.

Contributor settlement wallet handling requires separate architecture and compliance review.

---

# Error Handling

Handle:

* missing Contributor
* missing Credential
* Credential/Contributor mismatch
* missing Collection
* invalid Contribution Period
* invalid requirement
* missing evidence
* rejected evidence
* Contributor not qualified
* invalid distributable amount
* invalid basis points
* total allocation above 10,000 bps
* database unavailable
* failed calculation persistence
* failed approval

Do not expose raw Prisma errors.

---

# Financial Precision

All monetary calculations must use integer minor units.

For GBP:

`1 pound = 100 pence`

Never persist:

`425.50`

as a floating-point number.

Persist:

`42550`

where appropriate.

If calculations require intermediate values larger than safe JavaScript integer ranges, use BigInt.

Convert to Prisma-supported storage safely.

---

# Calculation Determinism

Given identical snapshot inputs, the engine must always produce the same result.

Do not introduce:

* random allocation
* time-dependent logic
* live market prices
* external exchange rates

Task 008 calculations must be deterministic.

---

# Design Direction

The interface should feel like:

* preparing a contributor settlement statement
* reviewing an archival compensation record
* approving a documented contribution calculation

It should not feel like:

* DeFi yield farming
* staking
* token rewards dashboard
* investment portfolio
* trading terminal

Use the existing ApingX design system.

---

# Language

Prefer:

* Contribution Period
* Contribution Requirement
* Evidence
* Verified
* Qualified
* Allocation
* Compensation
* Calculation
* Approval
* Settlement Pending

Avoid:

* Yield
* Dividend
* APY
* ROI
* Investment Return
* Passive Income
* Holder Reward

---

# Accessibility

Ensure:

* forms use explicit labels
* evidence review controls are keyboard accessible
* calculation summaries are semantically structured
* errors are associated with fields
* approval actions have clear text
* status is not communicated by colour alone
* financial values are readable on mobile

---

# Responsive Behaviour

Distribution administration must remain usable on mobile.

Do not hide:

* Contributor
* Credential
* eligibility
* allocation
* calculated compensation
* approval state

Long evidence URLs may truncate visually while remaining accessible.

---

# Strictly Out of Scope

Do not implement:

* actual payouts
* bank settlement
* Stripe Connect
* Stripe payouts
* SOL transfers
* USDC transfers
* SPL token transfers
* wallet payout automation
* automatic revenue pools
* Stripe revenue ingestion
* Credential-holder payouts
* NFT-owner payouts
* Credential transfer of compensation rights
* passive revenue sharing
* staking
* marketplace royalties
* smart contracts
* on-chain distribution program
* Contributor self-service portal
* social-media scraping
* automated tweet verification
* AI evidence verification
* tax withholding
* VAT calculations
* payroll
* invoices
* accounting integrations
* Mainnet settlement

---

# Deliverables

Task 008 ultimately requires:

* Contribution Period administration
* Contribution Requirement administration
* Contribution Evidence recording
* evidence verification
* Contributor eligibility determination
* distributable amount entry
* allocation validation
* deterministic integer-pence compensation calculation
* historical calculation snapshots
* calculation preview
* approval workflow
* audit-friendly presentation
* zero automatic settlement
* clear separation between Credential ownership and compensation entitlement

However:

If the existing Prisma schema lacks the required persistence models, Cursor must stop after producing the schema proposal.

---

# Required First Implementation Phase

Cursor must begin Task 008 with a schema-gap review.

Before writing feature code:

1. Inspect existing Prisma models.
2. Determine whether Task 008 persistence requirements can be represented.
3. If not, produce a minimal schema proposal.
4. Explain model relationships.
5. Explain snapshot behaviour.
6. Explain delete behaviour.
7. Explain uniqueness constraints.
8. Explain indexes.
9. Explain integer monetary storage.
10. Explain how Credential ownership remains separate from Contributor compensation entitlement.

Do not modify Prisma during this first phase.

Wait for CTO approval.

---

# Architecture Stop Conditions

Stop and request CTO review if any of the following become necessary:

* new financial settlement model
* payout execution
* bank details storage
* payment wallet storage beyond existing Contributor data
* Stripe revenue ledger
* Order integration
* tax model
* invoice model
* payroll model
* Credential-owner compensation
* transferable compensation rights
* smart contract
* on-chain reward distribution
* automatic Contributor eligibility
* external social-media APIs

---

# Required Automated Validation

After eventual implementation:

`npx tsc --noEmit`

`npm run lint`

`npm run build`

Do not claim success unless actually executed.

---

# Required Calculation Verification

Eventually manually verify at minimum:

### Case 1 — Normal calculation

Distributable amount:

`£8,500.00`

Contributor allocation:

`500 bps`

Expected compensation:

`£425.00`

### Case 2 — Multiple eligible Contributors

Pool:

`£10,000.00`

Contributor A:

`500 bps`

Contributor B:

`750 bps`

Expected:

A = `£500.00`
B = `£750.00`
Unallocated = `£8,750.00`

### Case 3 — Ineligible Contributor

Contributor B fails requirements.

Do not redistribute B's allocation.

### Case 4 — Allocation overflow

Eligible allocation exceeds 10,000 bps.

Approval must fail.

### Case 5 — Historical immutability

Approve a calculation.

Change current Credential allocation later.

Historical calculation must remain unchanged.

### Case 6 — Credential transfer

On-chain owner changes.

Contributor compensation result must remain based on Contributor eligibility and contractual allocation snapshot, not new NFT owner.

---

# Final Implementation Report

When full implementation is eventually complete, provide:

## Executive Summary

## Files Created

## Files Modified

## Dependencies

## Routes

## Schema Changes

## Contribution Period Model

## Requirements and Evidence

## Eligibility

## Credential Relationship

## Securities-Law Separation

Explain how the implementation avoids treating NFT ownership as automatic compensation entitlement.

## Calculation Engine

Include formula and rounding policy.

## Snapshot Behaviour

## Approval Workflow

## Auditability

## Error Handling

## Settlement Boundary

Confirm no actual payout occurs.

## Architecture Stop Conditions Encountered

## Deviations

## Automated Validation Results

## Manual Calculation Verification

## Git Status

Do not stage, commit or push.

---

# Task 008 Amendment — Distribution Basis and Net Qualifying Revenue

## Distribution Basis and Net Qualifying Revenue

### Purpose

Contributor compensation must be calculated from a defined and auditable commercial basis rather than directly from headline sales, gross checkout receipts, NFT ownership, or an unexplained manually entered distributable amount.

Task 008 therefore separates:

1. **Contributor qualification** — determined by Contribution Requirements and verified Evidence.
2. **Net Qualifying Revenue** — the reconciled commercial revenue attributable to the relevant Collection / Contribution Period.
3. **Approved Distributable Amount** — the portion of Net Qualifying Revenue approved for Contributor compensation.
4. **Distribution Calculation** — allocation of the approved distributable amount among eligible Contribution Period Participants.

These are separate stages and must remain independently auditable.

---

## Net Qualifying Revenue

### Definition

**Net Qualifying Revenue ("NQR")** means the net ex-VAT amount actually retained by ApingX from sales of qualifying products attributable to the relevant Collection and revenue period, after applicable discounts, refunds/returns and successful payment chargebacks, but excluding shipping/delivery charges and excluding ApingX operating costs.

The authoritative commercial formula is:

```text
Gross Qualifying Product Sales
− Discounts
− Product Returns / Refunds
− Successful Product Chargebacks
= Retained Product Revenue

− VAT attributable to retained qualifying product revenue
= Net Qualifying Revenue
```

Then:

```text
Net Qualifying Revenue
× Contributor Pool Basis Points
÷ 10,000
= Proposed Distributable Amount
```

All authoritative monetary calculations must use integer minor currency units (pence for GBP).

Floating-point arithmetic must not be used for authoritative financial calculations.

---

## Gross Qualifying Product Sales

Gross Qualifying Product Sales represents the qualifying product value attributable to the relevant Collection and revenue period before the NQR deductions defined below.

Only product revenue is qualifying revenue.

Separately identified shipping or delivery charges are excluded.

A future commerce integration may derive this figure automatically from order/payment records. Until such an integration exists, Task 008 may support an explicit Admin-entered and confirmed Distribution Basis.

The origin of the figures must not change the calculation rules.

---

## Discounts

Discounts reduce qualifying product revenue.

Compensation must be based on the amount economically charged for the qualifying product, rather than the undiscounted catalogue/list price.

Example:

```text
Product list price:        £100.00
Discount:                  -£20.00
Qualifying sale value:      £80.00
```

Do not calculate Contributor compensation from the £100 list price.

---

## Returns and Refunds

Product refunds and returns reduce qualifying revenue.

Only the qualifying **product component** of the refund is deducted from NQR.

Examples:

```text
Full £100 qualifying product refund
→ deduct £100 product revenue
```

```text
£25 partial qualifying product refund
→ deduct £25 product revenue
```

Refunded shipping/delivery charges must not be treated as a product-revenue deduction because shipping/delivery was not included as qualifying product revenue in the first place.

Return-postage costs paid by ApingX are operating expenses and are not additional NQR deductions.

A return/refund does not alter Contributor qualification.

Returns affect the commercial pool, not whether the Contributor performed the required contribution.

---

## Chargebacks

A successful chargeback or equivalent final payment reversal relating to qualifying product revenue reduces qualifying revenue.

A pending dispute must not be treated as a final chargeback adjustment.

A dispute resolved in ApingX's favour does not reduce qualifying revenue.

Processor penalties, dispute fees or other ancillary payment-processing costs are operating expenses and are not NQR deductions.

---

## VAT

Contributor compensation must not accrue on VAT.

The Distribution Basis must therefore identify the VAT amount excluded from retained qualifying product revenue before calculating NQR.

The VAT figure used for an approved Distribution Basis is an auditable financial input.

Task 008 does not attempt to become a VAT accounting engine.

Future commerce/accounting integrations may supply the VAT figure automatically.

---

## Shipping and Delivery

Separately identified shipping and delivery charges are excluded from qualifying product revenue.

They therefore:

* do not increase Gross Qualifying Product Sales;
* do not increase Net Qualifying Revenue;
* do not generate Contributor compensation.

Where shipping is refunded, that refunded shipping amount does not reduce NQR because the corresponding shipping receipt was not included in NQR.

This compensation definition is separate from ApingX's accounting and statutory VAT treatment of delivery charges.

---

## Operating Costs

Ordinary ApingX operating expenses must not be deducted when calculating NQR.

Examples include:

* manufacturing;
* garment blanks;
* printing and embroidery;
* fulfilment;
* warehousing;
* payment-processing fees;
* Stripe/payment-provider fees;
* advertising;
* photography;
* staff;
* professional fees;
* website/software costs;
* outbound shipping costs;
* return shipping costs;
* general overhead.

Task 008 is a **revenue-based compensation model**, not a net-profit participation model.

---

# Distribution Basis

Before a distributable amount can be approved, the Contribution Period must have a reconciled **Distribution Basis**.

The Distribution Basis must record sufficient information to explain how the proposed distributable amount was derived.

At minimum it must capture:

* currency;
* Gross Qualifying Product Sales;
* discounts;
* product returns/refunds;
* successful product chargebacks;
* retained product revenue;
* VAT excluded;
* Net Qualifying Revenue;
* Contributor Pool Basis Points;
* proposed distributable amount;
* returns/revenue reconciliation cutoff timestamp;
* basis calculation/version identifier;
* approval timestamp once approved.

Recommended version identifier:

```text
distribution-basis-v1
```

---

## Derived Values

Where practical, derived financial values must be calculated by the application rather than manually entered independently.

For example:

```text
retainedProductRevenue =
    grossQualifyingProductSales
    − discounts
    − productReturnsRefunds
    − successfulProductChargebacks
```

```text
netQualifyingRevenue =
    retainedProductRevenue
    − vatExcluded
```

```text
proposedDistributableAmount =
    floor(
        netQualifyingRevenue
        × contributorPoolBasisPoints
        / 10,000
    )
```

The application must reject internally inconsistent Distribution Basis data.

Negative NQR is not permitted for a Distribution Calculation.

Contributor Pool Basis Points must be within the permitted range of:

```text
0–10,000
```

---

# Revenue Reconciliation Window

Closing a Contribution Period finalises **Contributor eligibility**, but does not automatically finalise the commercial revenue basis.

These are intentionally separate events.

The lifecycle is:

```text
Contribution Period
        ↓
CLOSED
        ↓
Contributor eligibility final
        ↓
Revenue / returns reconciliation
        ↓
Distribution Basis prepared
        ↓
Distribution Basis approved
        ↓
Distribution Calculation created
```

A Distribution Calculation must not be created merely because the Contribution Period has closed.

The Distribution Basis must first be reconciled and explicitly approved.

---

## Reconciliation Cutoff

Every approved Distribution Basis must record a reconciliation cutoff timestamp.

The cutoff means:

> The Distribution Basis includes qualifying commercial transactions, refunds, returns and chargebacks recognised for this calculation through the stated reconciliation timestamp.

This timestamp provides financial snapshot finality.

Task 008 must not claim that no lawful return/refund can occur after this date.

It is an accounting/compensation reconciliation boundary, not a limitation of consumer rights.

---

# Late Returns and Post-Cutoff Adjustments

A return, refund or chargeback may legitimately occur after the reconciliation cutoff.

An already APPROVED Distribution Basis or APPROVED Distribution Calculation must **not be silently mutated** in response.

Task 008 must not automatically claw compensation back from a Contributor.

Task 008 must not automatically deduct a historical adjustment from an unrelated future Contribution Period.

Late financial corrections require an explicit correction mechanism.

For Task 008 Phase 4, the existing audit principle applies:

```text
historical approved record
→ preserve

correction required
→ VOID where permitted
→ create explicit replacement snapshot
```

Any more advanced cross-period adjustment, reserve, clawback or settlement-offset mechanism is outside Task 008 and requires separate specification.

---

# Distribution Basis Approval

Normal Admin editing may prepare an unapproved Distribution Basis.

Approval must be an explicit action.

Recommended UI terminology:

**Review & Approve Distribution Basis**

Before approval, the Admin must be able to review:

```text
Gross Qualifying Product Sales
Discounts
Returns / Refunds
Chargebacks
Retained Product Revenue
VAT Excluded
Net Qualifying Revenue
Contributor Pool %
Proposed Distributable Amount
Reconciliation Cutoff
```

The approval interface must state clearly that:

* approval finalises the financial basis used for Contributor calculation;
* approval does not create a payment;
* approval does not transfer funds;
* approval does not itself create a Distribution Calculation unless separately requested.

---

# Approved Distribution Basis Immutability

Once approved, the Distribution Basis becomes an historical financial record.

Its financial inputs and derived values must not be edited in place.

This includes:

* gross qualifying product sales;
* discounts;
* returns/refunds;
* chargebacks;
* retained product revenue;
* VAT excluded;
* NQR;
* Contributor Pool Basis Points;
* distributable amount;
* reconciliation cutoff;
* basis version.

Historical correction must use an explicit audit-safe correction/replacement workflow rather than overwriting approved values.

---

# Distribution Calculation Boundary

The Distribution Calculation consumes the **Approved Distributable Amount**.

It does not independently recalculate commerce revenue.

The financial pipeline is:

```text
Commerce activity
        ↓
Distribution Basis
        ↓
Net Qualifying Revenue
        ↓
Contributor Pool Basis Points
        ↓
Approved Distributable Amount
        ↓
Distribution Calculation
        ↓
Participant allocation
```

The existing `distribution-v1` allocation formula remains:

```text
floor(
    approvedDistributableAmountInPence
    × allocationBasisPointsSnapshot
    / 10,000
)
```

subject to Contributor eligibility.

---

# Eligibility Separation

Revenue reconciliation must never determine whether a Contributor is QUALIFIED.

Qualification remains based exclusively on the Contribution Requirements and Evidence rules defined elsewhere in Task 008.

Example:

```text
Contributor completes required activity
        ↓
Evidence VERIFIED
        ↓
Contributor QUALIFIED
```

Separately:

```text
Product commerce
        ↓
Returns/refunds reconciled
        ↓
NQR
        ↓
Approved Distributable Amount
```

The two streams meet only when the Distribution Calculation allocates the approved pool to eligible Participants.

A customer return must not change a Contributor from QUALIFIED to NOT_QUALIFIED.

---

# Credential and NFT Separation

The Distribution Basis must not use:

* NFT ownership;
* current NFT holder;
* `currentOwnerWallet`;
* `mintAddress`;
* secondary-market ownership;

to determine NQR, Contributor Pool Basis Points or the Approved Distributable Amount.

The compensated party remains the Contributor.

Credential records may provide allocation/provenance information to the Distribution Calculation only through the explicit Contribution Period Participant model defined elsewhere in Task 008.

Possession of a Credential/NFT alone does not establish compensation entitlement.

---

# Historical Snapshot Requirements

An historical Distribution Calculation must be traceable to the approved Distribution Basis used to create it.

The historical record must make it possible to establish:

1. what commercial revenue basis was approved;
2. what returns/refunds and chargebacks were recognised;
3. what reconciliation cutoff applied;
4. what NQR resulted;
5. what Contributor Pool Basis Points applied;
6. what distributable amount resulted;
7. which calculation consumed that approved amount;
8. which Participants were eligible;
9. what allocation snapshots were used;
10. what compensation was calculated.

Historical display must not depend on mutable live commerce data to explain these values.

---

# Initial Manual Workflow and Future Automation

Task 008 may initially support Admin-entered Distribution Basis figures.

This is intentionally an interim source-of-data mechanism.

Future tasks may integrate commerce/payment/accounting systems to derive:

* qualifying product sales;
* discounts;
* refunds;
* returns;
* chargebacks;
* VAT;

automatically.

Such integrations must feed the same Distribution Basis model and must not change the underlying NQR definition without an explicit version change.

The calculation source may evolve.

The historical calculation rules must remain versioned and auditable.

---

# Worked Example

Assume:

```text
Gross Qualifying Product Sales          £60,000.00
Discounts                               -£3,000.00
Product Returns / Refunds               -£5,000.00
Successful Product Chargebacks          -£1,000.00
                                        ──────────
Retained Product Revenue                £51,000.00

VAT Excluded                            -£8,500.00
                                        ──────────
NET QUALIFYING REVENUE                  £42,500.00

Contributor Pool Basis Points               2,000
Contributor Pool                              20%
                                        ──────────
PROPOSED DISTRIBUTABLE AMOUNT            £8,500.00
```

After explicit Distribution Basis approval:

```text
Approved Distributable Amount            £8,500.00
```

The subsequent Distribution Calculation applies Participant allocation basis points and eligibility to that £8,500 pool.

Returns/refunds have already affected the pool and must not separately affect Contributor eligibility.

---

# Out of Scope

Task 008 does not implement:

* customer return requests;
* return labels;
* warehouse return processing;
* Shopify order management;
* automated Stripe refund ingestion;
* automated VAT accounting;
* tax returns;
* Contributor clawbacks;
* Contributor reserves;
* cross-period settlement offsets;
* payout execution;
* bank transfers;
* SOL/USDC transfers;
* payroll;
* settlement reconciliation.

These require separate tasks/specifications.
