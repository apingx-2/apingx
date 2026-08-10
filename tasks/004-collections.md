# Task 004 – Collection Management

| Property | Value |
|----------|-------|
| Task | 004 |
| Status | Ready for Implementation |
| Owner | CTO |
| Depends On | Tasks 001–003a, Architecture 01–08 |
| Estimated Complexity | Medium |
| Estimated Duration | 1–2 Sessions |

---

# Product Intent

Collections are the primary publishing object in ApingX.

ApingX does not simply sell clothing.

It publishes collections.

Task 004 establishes the first real collection-management workflow inside the administration interface.

The objective is to allow the Founder/Admin to create, review, edit and manage Collection records while preserving the editorial, archival and provenance-led philosophy established throughout the architecture.

This is an internal publishing workflow.

It should feel like curating an exhibition or preparing a catalogue for publication rather than entering rows into a generic database administration tool.

---

# Implementation Rule

Follow the existing architecture exactly.

Before implementation, read:

- `architecture/01-product-architecture.md`
- `architecture/02-system-architecture.md`
- `architecture/03-data-model.md`
- `architecture/04-credential-specification.md`
- `architecture/05-technical-decisions.md`
- `architecture/06-design-system.md`
- `architecture/07-component-library.md`
- `architecture/08-the-chronicle.md`
- `tasks/004-collections.md`
- `prisma/schema.prisma`

Do not introduce new models or reinterpret the Collection model.

Task 004 must use the existing database architecture.

---

# Existing Collection Model

The current Prisma Collection model is authoritative for Task 004.

Collection fields currently include:

- `id`
- `collectionNumber`
- `slug`
- `name`
- `subtitle`
- `story`
- `status`
- `launchDate`
- `coverImageUrl`
- `createdAt`
- `updatedAt`

Collection statuses:

- `DRAFT`
- `PUBLISHED`
- `ARCHIVED`

Relationships already defined:

- Collection has many Products
- Collection has many Credentials

Do not modify the Prisma schema during this task unless implementation is impossible without doing so.

If a schema change appears necessary, stop and report it for CTO review before making the change.

---

# Required Routes

Implement the Collection management experience under:

- `/admin/collections`
- `/admin/collections/new`
- `/admin/collections/[id]`
- `/admin/collections/[id]/edit`

The existing `/admin/collections` placeholder should become the real Collection index.

Do not create additional Collection routes unless clearly required by this specification.

---

# Collection Index

`/admin/collections`

Purpose:

Provide an editorial overview of all Collection records.

The page should display Collection records using a reusable archive-oriented presentation rather than a generic analytics dashboard.

Each Collection should expose enough information to understand its state without opening the record.

Display:

- Collection number
- Name
- Subtitle where present
- Status
- Launch date where present
- Number of Products
- Number of Credentials
- Last updated date

Where appropriate, include the cover image if one exists.

Do not fabricate images or statistics.

---

# Collection Identity

Collection numbers should be presented as archival identifiers.

Preferred presentation:

`COLLECTION 001`

or an equivalent design-system treatment.

The Collection number should feel like part of the permanent archive identity rather than an ordinary database integer.

Do not change the stored data format.

---

# Empty State

If no Collections exist:

Do not show fake Collection records.

Use the existing Empty State philosophy.

Explain that the archive does not yet contain any published Collection records and provide a clear action to create the first Collection.

---

# Create Collection

`/admin/collections/new`

Provide a Collection creation form using the existing schema.

Fields:

- Collection Number
- Name
- Slug
- Subtitle
- Story
- Status
- Launch Date
- Cover Image URL

Requirements:

- `collectionNumber` is required
- `name` is required
- `slug` is required
- `story` is required
- `subtitle` is optional
- `launchDate` is optional
- `coverImageUrl` is optional
- `collectionNumber` must remain unique
- `slug` must remain unique

Do not implement image upload in Task 004.

`coverImageUrl` remains a URL field only.

---

# Default State

A newly created Collection should default to:

`DRAFT`

unless the user explicitly selects another valid status.

Do not automatically publish a Collection.

---

# Collection Detail

`/admin/collections/[id]`

Purpose:

Present a Collection as an archive object.

The detail page should feel closer to a catalogue record than an admin database row.

Display:

- Collection number
- Name
- Subtitle
- Story
- Status
- Launch date
- Cover image where present
- Created date
- Updated date
- Product count
- Credential count

Provide a clear Edit action.

Do not build Product or Credential management into this page.

Where Products or Credentials are referenced, counts or restrained summaries are sufficient for Task 004.

---

# Edit Collection

`/admin/collections/[id]/edit`

Allow editing of:

- Name
- Slug
- Subtitle
- Story
- Status
- Launch Date
- Cover Image URL

Collection Number should be treated as an archival identifier.

Do not allow it to be casually changed after creation.

If the current architecture or implementation requires it to remain editable, stop and report that decision before implementing it.

---

# Publishing Status

Use the existing Collection statuses only:

- DRAFT
- PUBLISHED
- ARCHIVED

Status must use the design-system Status treatment.

Never rely on colour alone.

Do not invent additional states such as:

- Scheduled
- Live
- Private
- Deleted

unless they are introduced through a future architectural decision.

---

# Publication Behaviour

Changing status to `PUBLISHED` changes the Collection database state only.

Task 004 does not implement:

- storefront publication
- homepage promotion
- Chronicle progression
- notifications
- Solana activity
- Credential minting
- Product activation
- automatic launch workflows

The database records business logic.

Do not create hidden side effects.

---

# Archive Behaviour

`ARCHIVED` represents a Collection retained within the historical record.

Archiving is not deletion.

Do not implement permanent Collection deletion in Task 004.

This follows the provenance philosophy:

Meaningful archive records should remain part of the historical record.

---

# Data Access

Use the shared Prisma client:

`lib/prisma.ts`

Prefer Server Components for data retrieval.

Use Server Actions or the existing agreed Next.js mutation pattern for Collection create/update operations if compatible with the current architecture.

Do not create unnecessary API routes.

Use explicit validation for all submitted values.

Use Zod if it is already appropriate to the project stack.

Do not trust client-side validation alone.

---

# Slug Handling

Slugs must remain unique.

The user may enter a slug manually.

Task 004 may provide a simple convenience for deriving a slug from the Collection name, but the user must be able to review and edit it before saving.

Do not introduce a complex slug system.

---

# Error Handling

The interface must handle:

- validation failure
- duplicate Collection number
- duplicate slug
- database unavailability
- missing Collection record
- failed create operation
- failed update operation

Do not expose raw Prisma errors or database connection details to the user.

Errors should be presented using the established design-system feedback language.

---

# Loading and Pending States

Mutating actions must communicate progress.

Do not allow repeated form submission while a save operation is pending.

Use restrained loading language.

No decorative animations.

---

# Design Direction

Apply:

- `architecture/06-design-system.md`
- `architecture/07-component-library.md`

The Collection interface should feel like:

- a curator preparing a catalogue entry
- a museum archive record
- a professional publishing interface

It should not feel like:

- a Shopify product editor
- a generic CMS
- a database table viewer
- a DeFi application
- a SaaS settings panel

---

# Information Density

The Collection index should provide meaningful information at a glance.

Do not hide basic Collection status and metadata behind unnecessary clicks.

However, do not turn the page into an analytics dashboard.

The objective is informed curation, not metrics reporting.

---

# Reusable Components

Reuse existing components wherever appropriate.

Create new reusable components only when existing components cannot satisfy the requirement.

Likely Collection-specific concepts may include:

- Collection Archive Card
- Collection Metadata
- Status Badge
- Collection Form
- Empty State

Do not create duplicate button, header, navigation or feedback systems.

---

# Accessibility

Ensure:

- all form controls have labels
- keyboard navigation works
- validation messages are associated with their fields
- focus states remain visible
- status is not communicated by colour alone
- forms remain usable on mobile
- images have suitable alt text
- actions use semantic controls

---

# Responsive Behaviour

The Collection workflow must remain fully usable on mobile.

Do not remove essential metadata on smaller screens.

Reflow rather than hide important information.

---

# Strictly Out of Scope

Do not implement:

- Product CRUD
- Contributor CRUD
- Credential CRUD
- Collection deletion
- image uploads
- media library
- drag-and-drop
- Clerk
- authentication
- role authorisation
- storefront publication
- customer-facing Collection pages
- homepage integration
- Chronicle progression
- Chapter management
- Stripe
- checkout
- inventory
- Solana
- NFT minting
- reward distribution
- analytics
- charts
- search
- advanced filtering
- sorting controls
- pagination
- bulk actions
- new Prisma models
- schema redesign
- migrations unless explicitly approved

---

# Deliverables

Cursor must deliver:

- functional `/admin/collections`
- functional `/admin/collections/new`
- functional `/admin/collections/[id]`
- functional `/admin/collections/[id]/edit`
- Collection creation
- Collection editing
- Collection status management
- archive-oriented Collection presentation
- validation
- error handling
- responsive behaviour
- reusable Collection components where justified

---

# Required Validation

Run:

`npx tsc --noEmit`

`npm run lint`

`npm run build`

Where practical, also manually verify:

- Collection index loads with the seeded Collection
- Collection detail loads
- new Collection form loads
- valid Collection can be created
- duplicate Collection number is rejected
- duplicate slug is rejected
- Collection can be edited
- Collection can be archived
- no delete functionality exists
- database errors do not expose raw technical information

Do not claim validation passed unless it was actually performed.

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

Every Collection route implemented.

## Data Behaviour

Explain how Collections are read, created and updated.

## Validation

Explain server-side and client-side validation.

## Error Handling

Explain duplicate and database failure behaviour.

## Architecture Decisions

List any implementation decisions made within the permitted scope.

## Deviations

List any deviations from this task.

If none:

`No deviations from the Task 004 specification.`

## Validation Results

Report exact results for:

- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`

## Git Status

Include:

`git status --short`

Do not stage, commit or push.




