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
