---
name: responsive-ui
description: Master guidelines and principles for auditing and remediating Responsive UI / UX in web applications. Use when the user requests a responsive UI fix, audit, or mentions mobile/tablet rendering issues.
---

# Responsive UI Remediation Skill

## 1. Primary Objective
Fix responsive UI problems systematically. All web applications and UIs MUST be responsive by default. Web applications must provide a consistent, usable experience across all screen sizes (Large Desktop down to Narrow Mobile). The UI must reflow, reorganize, collapse, stack, scroll, or transform appropriately depending on available screen width, instead of simply shrinking.

## 2. Responsive Design Principle
Follow this hierarchy: **Design System → Layout System → Shared Components → Pages → Individual Elements**.
Solve systemic problems globally, not with page-specific CSS hacks. 

## 3. Breakpoint Strategy
At minimum, validate:
- Large Desktop (1920px)
- Desktop (1440px)
- Laptop (1280px)
- Small Laptop (1024px)
- Tablet Landscape (900px)
- Tablet Portrait (768px)
- Large Mobile (430px)
- Standard Mobile (390px)
- Small Mobile (360px)
- Narrow Mobile (320px)

Prefer flexible layouts (Flexbox, CSS Grid, `min-width: 0`, `clamp()`) over arbitrary media queries. Do not force unnecessary breakpoints.

## 4. Mobile-First Implementation
Implement responsive behavior using a mobile-first approach where practical.
- Stack content vertically where appropriate
- Reduce unnecessary spacing
- Collapse navigation
- Convert multi-column layouts into single-column
- Ensure touch targets are sufficiently large
- Prevent horizontal page scrolling (allow internal component scrolling instead)

## 5. Key Focus Areas
- **Application Shell:** Sidebar, Header, Navigation must adapt (e.g. permanent -> collapsible -> drawer).
- **Tables:** Do not compress unreadably. Use horizontal scrolling, column prioritization, card-based rendering, or expandable rows.
- **Forms:** Stack fields on mobile, ensure inputs don't become too narrow.
- **Modals/Drawers:** Respect viewport width, allow vertical scrolling, keep actions accessible.
- **Charts:** Resize to parent containers, prevent breaking grids.
- **Search & Filters:** Stack logically rather than shrinking horizontally.

## 6. Implementation Process
1. Inspect the architecture and identify systemic problems.
2. Fix global architecture first (Shell -> Container -> Shared Components -> Pages).
3. Validate each change against desktop and mobile viewports.
4. Never use `overflow-x: hidden` globally to hide responsive bugs; fix the source layout element (often a wide fixed container, a `<pre>`, a flex item missing `min-width: 0`, etc).

## 7. Quality Gate
The job is complete only when: Layout, Navigation, Forms, Tables, Modals, Dashboards, and Accessibility all work across mobile and desktop without unintended horizontal scroll or clipped content.
