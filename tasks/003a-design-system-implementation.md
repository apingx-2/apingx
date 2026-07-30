# Task 003a – Design System Implementation

| Property | Value |
|----------|-------|
| Task | 003a |
| Status | Ready for Implementation |
| Owner | CTO |
| Depends On | Tasks 001–003, Architecture 06–08 |
| Estimated Complexity | Medium |
| Estimated Duration | 1 Session |

---

# Product Intent

Task 003 established the architecture of the administration interface.

Task 003a establishes the visual language that every future feature will inherit.

The objective is not to redesign the dashboard.

The objective is to make the dashboard unmistakably ApingX.

Every visual refinement should reinforce the identity of a curated archive rather than a generic administration system.

---

# Implementation Rule

Every visual refinement introduced by this task must be reusable.

No styling should exist solely for one page if it is expected to appear elsewhere in the platform.

Task 003a establishes the visual foundation for every administration screen that follows.


# Brand Integration

## Objective

Integrate the official ApingX wordmark into the administration interface as the permanent visual anchor of the platform.

The implementation must reinforce the philosophy established in:

- architecture/06-design-system.md
- architecture/07-component-library.md
- architecture/08-the-chronicle.md

The wordmark represents continuity.

The Chronicle represents evolution.

The implementation should preserve that relationship.

---

## Requirements

Create a reusable branding component:

`ApingXWordmark`

The component should:

- support `light` and `dark` variants
- use the official assets from `public/brand/`
- preserve the original proportions
- enforce consistent clear space
- expose a simple, reusable API
- include appropriate accessibility attributes

---

## Sidebar Integration

Use the wordmark as the primary visual anchor of the admin sidebar.

Supporting editorial text should remain restrained.

Recommended presentation:

APINGX (wordmark)

The Living Archive

Archive Administration

━━━━━━━━━━━━━━━━━━

Navigation

The Chronicle should support the wordmark rather than compete with it.

---

## Visual Rules

Do not:

- redraw the wordmark
- recolour the wordmark
- distort proportions
- animate the wordmark
- add glow effects
- add decorative gradients
- add unnecessary shadows

The environment surrounding the wordmark should provide the premium feel—not the artwork itself.

---

## Future Compatibility

The implementation should anticipate future additions including:

- Chronicle Chapters
- Exhibition identifiers
- Collection milestones
- Museum mode
- Editorial homepage

These features are not part of this task.

---

## Out of Scope

Do not implement:

- dynamic Chronicle chapters
- logo redesign
- logo animation
- homepage Chronicle integration
- additional brand marks
- app icons
- favicons

---

# Deliverables

Cursor must deliver:

- Updated reusable UI components
- Reusable `ApingXWordmark` component
- Refined sidebar
- Refined header
- Refined Summary Cards
- Updated global styling
- Responsive validation
- TypeScript validation
- ESLint validation
- Production build validation
- Implementation summary
- Git status

Do not commit or push changes.

---

# CTO Review Checklist

The implementation will be reviewed against the following criteria:

- Does the interface immediately feel more like ApingX?
- Does the design system appear consistent throughout?
- Is the wordmark integrated respectfully?
- Is the sidebar calmer and more editorial?
- Do Summary Cards feel like premium archival objects?
- Is the typography hierarchy clearer?
- Are interactions restrained?
- Has responsiveness been preserved?
- Does the implementation remain within scope?