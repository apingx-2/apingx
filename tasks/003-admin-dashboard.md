# Task 003 — Admin Dashboard Foundation

## Objective

Build the foundational ApingX admin dashboard interface.

This task must establish the admin layout, navigation and overview page structure required for later collection, product, contributor and Credential management tasks.

The dashboard should feel like an internal publishing tool for a premium fashion archive, not a generic cryptocurrency dashboard.

## Product Principles

- Fashion comes first.
- - Technology should support the brand without overwhelming it.
- The interface should use plain language rather than unnecessary blockchain terminology.
- The dashboard is an internal operational tool.
- Collection publishing is the primary workflow.
- This task establishes presentation and navigation only.

## Scope

Build:

- An `/admin` dashboard route
- A reusable admin layout
- A desktop sidebar
- A mobile navigation treatment
- A dashboard header
- An overview page
- Reusable summary-card components
- Clear empty and unavailable states
- Navigation placeholders for future admin sections

Do not implement create, update or delete operations.

## Required Routes

### `/admin`

The main admin overview page.

The route must render inside the shared admin layout.

Do not create functional management routes in this task unless a minimal placeholder route is necessary to prevent broken navigation.

## Admin Navigation

Include navigation items for:

- Overview
- Collections
- Products
- Contributors
- Credentials

The Overview item must link to:

```text
/admin
```

Future sections should use these intended paths:

```text
/admin/collections
/admin/products
/admin/contributors
/admin/credentials
```

Navigation must clearly indicate the currently active section.

Do not add navigation for orders, payments, rewards, wallets, minting or marketplace functionality.

## Admin Layout

Create a reusable layout for all `/admin` routes.

The layout should include:

- ApingX wordmark or text logo
- “Admin” or “Archive Administration” context
- Sidebar navigation on desktop
- Accessible mobile navigation
- Main content region
- Consistent spacing and maximum content width

The layout must work at mobile, tablet and desktop widths.

## Dashboard Header

The overview page should include:

- Page title: `Overview`
- A concise description of the dashboard’s purpose
- No non-functional primary action button

Suggested description:

```text
Manage the collections, products, contributors and Credentials that make up the ApingX Archive.
```

## Overview Summary

Display one summary card for each core database entity:

- Collections
- Products
- Contributors
- Credentials

Each card should include:

- Entity name
- Count
- Short contextual label
- Link or clear navigation affordance to its future section

Use real database counts only when they can be retrieved safely without requiring unavailable infrastructure.

If `DATABASE_URL` is not configured or the database cannot be reached, the page must still render successfully using an honest unavailable state.

Do not display invented counts as real data.

Acceptable unavailable presentations include:

```text
—
Not available
Database not connected
```

Do not silently display zero when the database was not queried successfully.

## Data Access

Prefer server components for the admin overview.

If database access is implemented:

- Import the shared Prisma singleton from `lib/prisma.ts`.
- Retrieve only aggregate counts.
- Do not retrieve full entity records.
- Run independent count queries efficiently.
- Handle an unavailable database without crashing the page.
- Do not expose database errors or connection strings to the browser.
- Log only appropriate server-side error information.

Do not create an API route solely to retrieve overview counts.

## Components

Create small reusable components where appropriate, such as:

```text
components/admin/admin-sidebar.tsx
components/admin/admin-mobile-nav.tsx
components/admin/admin-header.tsx
components/admin/summary-card.tsx
```

Exact filenames may vary if the existing project convention suggests clearer names.

Avoid one oversized dashboard component.

## Visual Direction

The admin dashboard should evolve the visual identity of ApingX 1.0 rather than replacing it.

The interface should retain a crypto-native, underground and digitally collectible feel while presenting it with greater polish and maturity.

The intended direction is:

- Crypto-native editorial luxury
- Dark and atmospheric
- Sharp and high contrast
- Slightly glossy
- Fashion-led
- Premium without feeling corporate
- Familiar to the existing ApingX subculture

The dashboard should feel like an upgraded internal interface belonging to the same world as the current ApingX platform.

### Preserve From ApingX 1.0

Where appropriate, retain the spirit of:

- Dark backgrounds
- Strong monochrome contrast
- Bold uppercase typography
- Crypto-native terminology and cultural references
- Digital collectible presentation
- Fashion-drop energy
- Slightly unconventional navigation and naming
- A sense of exclusivity and underground culture

Do not copy the existing website pixel-for-pixel.

Use it as visual and cultural inspiration for an evolved ApingX interface.

### Premium Upgrade

Increase the sense of quality through:

- More disciplined spacing
- Clearer typography hierarchy
- Refined borders
- Subtle translucent surfaces
- Controlled highlights
- Slight glass-like or reflective treatments
- Restrained gradients
- Improved responsive behaviour
- Cleaner alignment
- More deliberate hover and focus states
- Higher-quality empty and unavailable states

Gloss should remain subtle. It should not make the dashboard feel like a generic gaming interface or speculative token platform.

### Colour and Surface Treatment

Prefer:

- Black, near-black or charcoal page backgrounds
- Off-white primary text
- Muted grey secondary text
- One restrained brand accent
- Thin low-contrast borders
- Occasional soft highlights or surface gradients
- Semi-transparent panels where readability is preserved

Avoid:

- Bright multicolour gradients
- Excessive neon
- Large glowing effects
- Overly reflective chrome
- Generic purple Web3 styling
- Constant animated backgrounds
- Excessive blur
- Low-contrast glassmorphism
- Decorative visual effects that reduce usability

### Cards

Summary cards may use a subtle glossy treatment.

Suitable treatments include:

- Dark translucent surfaces
- Fine borders
- Gentle inner highlights
- Small gradient reflections
- Controlled hover elevation
- Minimal corner rounding

Cards must remain readable and operational rather than decorative.

Avoid excessive rounded cards, strong drop shadows or oversized glowing elements.

### Typography

Use the existing project typography unless an architecture document specifies otherwise.

Typography should feel:

- Bold
- Editorial
- Contemporary
- Digital
- Fashion-conscious

Use uppercase labels selectively for navigation, metadata and section markers.

Do not make all body copy uppercase.

### Brand Evolution Principle

This version of the admin dashboard is intended primarily for the existing ApingX subculture and early community.

It should preserve crypto credibility and cultural familiarity while introducing a more premium finish.

Do not redesign ApingX as a conventional luxury fashion house in this task.

The interface may transition toward a broader luxury audience in a future dedicated brand-evolution phase after a strong core following has been established.

## Accessibility

Requirements:

- Use semantic navigation elements.
- Provide accessible labels for icon-only controls.
- Ensure keyboard navigation works.
- Maintain visible focus states.
- Use sufficient colour contrast.
- Mark the active navigation item appropriately.
- Mobile navigation must not depend solely on pointer interaction.

## Error and Empty States

The admin page must remain usable when:

- `DATABASE_URL` is missing
- PostgreSQL is unavailable
- No records exist

Differentiate between:

- A successful query returning zero records
- A failed or unavailable database query

Do not expose raw Prisma errors in the rendered interface.

## Out of Scope

Do not implement:

- Clerk authentication
- Admin authorisation or role checking
- Collection creation or editing
- Product creation or editing
- Contributor creation or editing
- Credential creation or editing
- Forms
- Server actions that mutate data
- API mutation routes
- Image uploads
- Orders
- Checkout or Stripe
- Inventory
- Solana wallet connections
- NFT minting
- Credential ownership verification
- Reward calculations
- Royalty payments
- Charts based on invented data
- Analytics
- Search, sorting or pagination
- New database models or schema changes

Authentication and admin authorisation must be completed in a dedicated task before the dashboard is deployed publicly.

## Technical Constraints

- Use TypeScript.
- Use the existing Next.js App Router.
- Use Tailwind CSS.
- Prefer server components.
- Add `"use client"` only where browser interactivity requires it.
- Do not install a UI component framework.
- Do not modify the Prisma schema.
- Do not add environment secrets.
- Do not suppress TypeScript or ESLint errors.
- Do not commit generated build output.

## Validation

The following commands must succeed:

```bash
npx tsc --noEmit
npm run lint
npm run build
```

The production build must succeed without a running PostgreSQL database.

Manually verify:

- `/admin` renders
- Desktop navigation is visible at an appropriate width
- Mobile navigation is usable
- The active Overview navigation item is clear
- Database unavailability does not crash the page
- No navigation item leads to an accidental 404 if it is presented as an active link

## Deliverables

- Admin route and reusable layout
- Responsive admin navigation
- Overview header
- Four entity summary cards
- Honest database-unavailable handling
- Any minimal placeholder pages required for valid navigation
- Concise implementation summary
- List of changed files
- Validation results
- Assumptions made

## Acceptance Criteria

Task 003 is complete only when:

- `/admin` renders within a reusable admin layout.
- Navigation covers the five specified admin sections.
- Navigation is accessible and responsive.
- The active section is visually and semantically identifiable.
- The overview includes Collections, Products, Contributors and Credentials.
- Real counts are used only when successfully retrieved.
- Database failure does not prevent the production build or crash the route.
- No raw database error is exposed to the user.
- No data mutation functionality has been added.
- No authentication implementation has been added.
- No Prisma schema changes have been made.
- TypeScript, lint and production build validation pass.
- No out-of-scope functionality has been introduced.
- The visual design retains a recognisable crypto-native ApingX character while presenting a more polished and subtly glossy finish.