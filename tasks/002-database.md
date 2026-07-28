# Task 002 — Database Foundation

## Objective

Build the PostgreSQL persistence layer required to support ApingX Collection 001.

This task must establish the database schema, Prisma configuration and database connection only.

Do not build application screens, admin functionality, checkout, Solana minting or reward distribution logic.

## Product Rules

- The database records ApingX business logic.
- Solana records Credential ownership.
- A Collection is the primary publishing object.
- Products belong to a Collection.
- Credentials belong to a Collection.
- Contributors may receive one or more Credentials.
- Reward allocations must be stored precisely and must not use floating-point values.
- This schema should support Collection 001 without attempting to model every future feature.

## Required Models

### User

Represents an authenticated platform user.

Required fields:

- id
- clerkUserId
- email
- firstName
- lastName
- role
- createdAt
- updatedAt

Roles:

- ADMIN
- CUSTOMER

Requirements:

- `clerkUserId` must be unique.
- `email` must be unique.

### Collection

Represents a published ApingX fashion collection.

Required fields:

- id
- collectionNumber
- slug
- name
- subtitle
- story
- status
- launchDate
- coverImageUrl
- createdAt
- updatedAt

Statuses:

- DRAFT
- PUBLISHED
- ARCHIVED

Requirements:

- `collectionNumber` must be unique.
- `slug` must be unique.
- `launchDate` may be null before publication.

### Product

Represents a physical fashion product within a Collection.

Required fields:

- id
- collectionId
- name
- slug
- description
- priceInPence
- currency
- status
- imageUrl
- createdAt
- updatedAt

Statuses:

- DRAFT
- ACTIVE
- SOLD_OUT
- ARCHIVED

Requirements:

- Each Product must belong to one Collection.
- Store GBP prices as integer pence.
- `priceInPence` must not use a floating-point type.
- A Product slug must be unique within its Collection.

### Contributor

Represents a person or organisation recognised for contributing to a Collection.

Required fields:

- id
- displayName
- biography
- email
- walletAddress
- imageUrl
- createdAt
- updatedAt

Requirements:

- `email` may be null.
- `walletAddress` may be null.
- Do not require a Contributor to have a platform User account.

### Credential

Represents an off-chain database record associated with a future Solana NFT.

Required fields:

- id
- collectionId
- contributorId
- credentialNumber
- type
- allocationBasisPoints
- mintAddress
- currentOwnerWallet
- mintedAt
- createdAt
- updatedAt

Types:

- FOUNDER
- CONTRIBUTOR

Requirements:

- Each Credential belongs to one Collection.
- A Contributor relation may be null for Founder Credentials.
- `credentialNumber` must be unique within its Collection.
- Store reward allocation in basis points.
- 10,000 basis points represents 100%.
- Do not use a floating-point type for allocations.
- `mintAddress`, `currentOwnerWallet` and `mintedAt` may be null before minting.
- `mintAddress` must be unique when present.
- The database record must not be treated as authoritative proof of current blockchain ownership.

## Relationships

- Collection has many Products.
- Collection has many Credentials.
- Contributor has many Credentials.
- User is independent from Contributor in Task 002.

## Prisma Requirements

- Use PostgreSQL as the datasource.
- Use `DATABASE_URL` from the environment.
- Add a reusable Prisma client singleton in `lib/prisma.ts`.
- Prevent unnecessary Prisma client instances during Next.js development hot reload.
- Use suitable indexes and unique constraints.
- Use explicit enum names.
- Use cascading deletion only where clearly safe.
- Do not cascade-delete Credentials when deleting Contributors.
- Format and validate the Prisma schema.

## Environment Requirements

Ensure `.env.example` contains:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/apingx"

Paste this:

```markdown
Do not add real credentials or secrets.

## Seed Data

Create a minimal Prisma seed script containing:

- Collection 001 in DRAFT status
- one example Product
- one example Contributor
- one Contributor Credential

The seed data must be clearly marked as development data.

Do not create production content or real wallet addresses.

## Validation

The following commands must succeed:

```bash
npx prisma format
npx prisma validate
npm run lint
npm run build