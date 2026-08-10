# Task 005 – Product Management

| Property | Value |
|----------|-------|
| Task | 005 |
| Status | Ready for Implementation |
| Owner | CTO |
| Depends On | Tasks 001–004, Architecture 01–08 |
| Estimated Complexity | Medium |
| Estimated Duration | 1–2 Sessions |

---

# Product Intent

Products are the physical fashion objects published within an ApingX Collection.

A Product must never exist independently of a Collection.

Task 005 establishes the internal Product management workflow required to prepare physical pieces for publication.

The objective is to allow the Founder/Admin to create, review, edit and manage Products while preserving the archive-led philosophy established throughout ApingX.

The interface should feel like cataloguing a physical artefact within an exhibition rather than entering merchandise into a generic ecommerce system.

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
- `tasks/005-products.md`
- `prisma/schema.prisma`
- existing Task 004 Collection implementation

Follow the documented architecture exactly.

Do not introduce new models or reinterpret the existing Product model.

Task 005 must use the existing database architecture.

If implementation appears to require a Prisma schema change, stop and report it for CTO review before making the change.

---

# Existing Product Model

The existing Prisma Product model is authoritative.

Fields:

- `id`
- `collectionId`
- `name`
- `slug`
- `description`
- `priceInPence`
- `currency`
- `status`
- `imageUrl`
- `createdAt`
- `updatedAt`

Statuses:

- `DRAFT`
- `ACTIVE`
- `SOLD_OUT`
- `ARCHIVED`

Relationships:

- Product belongs to one Collection

Existing database rule:

- Product slug is unique within its Collection.

Do not modify these rules in Task 005.

---

# Required Routes

Implement:

- `/admin/products`
- `/admin/products/new`
- `/admin/products/[id]`
- `/admin/products/[id]/edit`

The existing `/admin/products` placeholder should become the Product index.

Do not create additional Product routes unless required by this specification.

---

# Product Index

`/admin/products`

Purpose:

Provide an archive-oriented overview of physical Products across Collections.

Each Product should expose enough information to understand:

- what it is
- which Collection it belongs to
- its publishing state
- its price

Display:

- Product name
- Collection number
- Collection name
- Product status
- Price
- Currency
- Last updated date
- Image where available

Do not fabricate images, stock quantities or sales information.

---

# Product Identity

Products should always retain visible connection to their parent Collection.

Where appropriate, present:

`COLLECTION 001`

alongside the Product.

The Collection is the primary publishing object.

The Product is an artefact within it.

---

# Empty State

If no Products exist:

Do not display fake Product records.

Explain that no physical artefacts have yet been catalogued and provide a clear action to create the first Product.

---

# Create Product

`/admin/products/new`

Provide a Product creation form.

Fields:

- Collection
- Name
- Slug
- Description
- Price
- Currency
- Status
- Image URL

Requirements:

- Collection is required
- Name is required
- Slug is required
- Description is required
- Price is required
- Currency is required
- Status is required
- Image URL is optional

A Product cannot be created without a valid Collection.

Do not allow arbitrary Collection IDs to be entered manually.

The Collection should be selected from existing Collection records.

---

# Price Handling

The database stores Product prices in:

`priceInPence`

The administration form should present the price in normal currency notation.

Example:

`£85.00`

must persist as:

`8500`

Do not use floating-point values for persisted prices.

Conversion must occur safely at the server/data boundary.

Reject:

- negative prices
- malformed prices
- values with more than two decimal places
- invalid numeric input

Do not silently round invalid prices.

---

# Currency

Task 005 should support the existing Product `currency` field.

For Collection 001, the expected currency is:

`GBP`

Do not introduce currency conversion.

Do not fetch exchange rates.

Do not implement multi-currency commerce.

If the interface permits currency selection, keep it restrained and limited to the values supported by the current architecture.

Do not make architectural currency decisions during this task.

---

# Default State

A newly created Product should default to:

`DRAFT`

unless the user explicitly chooses another valid Product status.

Do not automatically activate a Product.

---

# Product Detail

`/admin/products/[id]`

Purpose:

Present the Product as a physical archive object.

Display:

- Product name
- Collection identity
- Description
- Price
- Currency
- Status
- Image where present
- Created date
- Updated date

Provide a clear Edit action.

Do not display fabricated inventory, sales, checkout or blockchain data.

---

# Edit Product

`/admin/products/[id]/edit`

Allow editing:

- Collection
- Name
- Slug
- Description
- Price
- Currency
- Status
- Image URL

Changing a Product's Collection is permitted only if supported cleanly by the existing model.

If moving Products between Collections creates an architectural ambiguity, stop and report it before implementing a new rule.

---

# Product Status

Use only:

- `DRAFT`
- `ACTIVE`
- `SOLD_OUT`
- `ARCHIVED`

Status must use the established Status Badge design language.

Never rely on colour alone.

Do not invent additional states such as:

- Hidden
- Scheduled
- Preorder
- Deleted
- Unavailable

---

# Status Behaviour

Status changes update Product business state only.

Task 005 must not introduce hidden side effects.

Changing a Product to `ACTIVE` must not:

- publish a storefront
- create Stripe Products
- create inventory
- mint NFTs
- trigger notifications
- modify its Collection
- create blockchain transactions

These behaviours belong to future tasks.

---

# Archive Behaviour

`ARCHIVED` means the Product remains part of the ApingX historical record.

Archiving is not deletion.

Do not implement permanent Product deletion in Task 005.

---

# Slug Handling

Product slugs must remain unique within their Collection.

The same slug may exist in different Collections if permitted by the existing database constraint.

Example:

Collection 001:

`archive-tee`

Collection 002:

`archive-tee`

may coexist.

Two Products in the same Collection may not use the same slug.

The form may derive a slug from the Product name as a convenience.

The user must be able to review and edit it before saving.

---

# Collection Relationship

The Product form should retrieve valid Collections from the database.

Present Collection choices using meaningful archival identity.

Preferred presentation:

`COLLECTION 001 — Provenance`

rather than exposing internal database IDs.

Persist the Collection ID internally.

---

# Data Access

Use:

`lib/prisma.ts`

Prefer Server Components for reads.

Use Server Actions for create/update operations, following the successful pattern established in Task 004.

Do not create unnecessary API routes.

All mutation input must be validated server-side.

Client validation may improve usability but must never be authoritative.

---

# Validation

Use Zod consistently.

Validate:

- collectionId
- name
- slug
- description
- price input
- currency
- status
- optional imageUrl

Server validation must occur before Prisma writes.

Do not expose raw Prisma errors.

---

# Duplicate Handling

Handle duplicate Product slug within a Collection gracefully.

The user should receive a clear field-level message.

Do not expose Prisma constraint names or database errors.

---

# Error Handling

Handle:

- validation failure
- missing Collection
- missing Product
- duplicate Product slug within Collection
- database unavailable
- failed create operation
- failed update operation

Use the established feedback language from the Design System.

---

# Loading and Pending States

Create and update actions must communicate pending state.

Prevent repeated submission while saving.

Use restrained interaction feedback.

No decorative loading animation.

---

# Design Direction

Apply:

- `architecture/06-design-system.md`
- `architecture/07-component-library.md`

The Product interface should feel like:

- a museum object record
- a fashion archive
- a curator cataloguing a physical piece
- an editorial publishing tool

It should not feel like:

- Shopify
- Amazon Seller Central
- generic ecommerce administration
- inventory software
- a crypto marketplace

Fashion comes first.

Technology remains quiet.

---

# Reusable Components

Reuse existing Task 003a and Task 004 components where appropriate.

Create Product-specific components only where required.

Likely concepts may include:

- Product Archive Card
- Product Metadata
- Product Form
- Price Display
- Collection Reference

Do not duplicate:

- status systems
- buttons
- page headers
- navigation
- empty states
- general feedback patterns

Prefer extending reusable concepts over creating parallel systems.

---

# Image Handling

Task 005 does not implement uploads.

`imageUrl` remains an optional URL field.

If no image exists:

- present the Product without fabricating placeholder fashion imagery
- use a restrained archive empty-image treatment where necessary

Do not source external images automatically.

---

# Accessibility

Ensure:

- every form control has an explicit label
- errors are associated with fields
- keyboard navigation works
- focus states remain visible
- status is not communicated solely through colour
- Product images include appropriate alt text
- forms remain usable on mobile
- interactive controls use semantic elements

---

# Responsive Behaviour

All Product workflows must remain functional on mobile.

Important Product information should reflow rather than disappear.

Do not remove Collection identity, status or price merely to simplify mobile presentation.

---

# Strictly Out of Scope

Do not implement:

- inventory quantities
- sizes
- variants
- SKUs
- Product deletion
- Product duplication
- media upload
- media library
- drag-and-drop
- customer-facing Product pages
- storefront
- cart
- checkout
- Stripe Product creation
- Stripe Prices
- tax calculation
- shipping
- stock management
- order management
- Contributor management
- Credential management
- Solana
- NFTs
- blockchain ownership
- reward allocations
- analytics
- charts
- sales statistics
- search
- advanced filters
- sorting controls
- pagination
- bulk actions
- new Prisma models
- schema redesign

These belong to later tasks or future architectural decisions.

---

# Deliverables

Cursor must deliver:

- functional `/admin/products`
- functional `/admin/products/new`
- functional `/admin/products/[id]`
- functional `/admin/products/[id]/edit`
- Product creation
- Product editing
- Product status management
- Collection selection
- safe price conversion
- archive-oriented Product presentation
- validation
- duplicate handling
- error handling
- responsive behaviour
- reusable Product components where justified

---

# Required Validation

Run:

`npx tsc --noEmit`

`npm run lint`

`npm run build`

With the local PostgreSQL database running, manually verify:

- seeded Product appears on Product index
- Product detail loads
- new Product can be created
- Product requires a Collection
- £85.00 persists as 8500 pence
- malformed price is rejected
- duplicate Product slug in the same Collection is rejected
- valid duplicate slug in a different Collection behaves according to the database constraint
- Product can be edited
- Product can be marked SOLD_OUT
- Product can be ARCHIVED
- edit form reloads persisted values correctly
- no delete functionality exists
- no raw Prisma errors are displayed

Do not claim manual validation unless it was actually performed.

---

# Future Crypto Price Presentation

GBP remains the canonical Product price.

`priceInPence` is the authoritative stored price for Task 005.

Future customer-facing interfaces may display an indicative crypto equivalent, including SOL, alongside the fiat price.

Example:

£85.00
≈ 0.42 SOL

The crypto amount must not be stored as a fixed Product price.

It should be calculated from the canonical fiat price using an approved market rate at display or checkout time.

Task 005 must not implement:

- live SOL pricing
- exchange-rate APIs
- crypto price caching
- Solana payments
- USDC payments
- wallet connection
- checkout conversion logic

These belong to the checkout/payment architecture.

---

# Final Implementation Report

When finished, provide:

## Executive Summary

What was built.

## Files Created

Every new file.

## Files Modified

Every modified file.

## Routes

Every Product route implemented.

## Data Behaviour

Explain how Products are read, created and updated.

## Collection Relationship

Explain how Products are associated with Collections.

## Price Handling

Explain exactly how user-facing currency values are converted to/from integer pence.

## Validation

Explain client and server validation.

## Error Handling

Explain duplicate and database failure behaviour.

## Architecture Decisions

List implementation decisions made within permitted scope.

## Deviations

List deviations from this specification.

If none:

`No deviations from the Task 005 specification.`

## Validation Results

Report exact results for:

- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`

Include manual database verification results separately.

## Git Status

Include:

`git status --short`

Do not stage, commit or push.










