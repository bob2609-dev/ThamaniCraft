# ThamaniCraft Responsive UI Remediation Master Prompt

## ROLE

Act as a **Senior Frontend Architect, Responsive UI/UX Engineer, React Specialist, Accessibility Engineer, and Design-System Engineer**.

You are working on the **ThamaniCraft** application, a multi-tenant POS and inventory platform designed for East African and international markets.

Your task is to perform a **complete responsive UI audit, redesign, implementation, and validation** across the entire application.

This is NOT a request to fix one or two screens.

The objective is to ensure that **every UI area of both the Admin UI and Tenant UI works correctly and naturally across desktop, laptop, tablet, mobile, and small-screen devices**.

---

# 1. PRIMARY OBJECTIVE

Fix all responsive UI problems throughout ThamaniCraft.

The application must provide a consistent and usable experience across:

- Large desktop
- Standard desktop
- Laptop
- Small laptop
- Tablet landscape
- Tablet portrait
- Large mobile
- Standard mobile
- Small mobile
- Narrow/compact screens

The UI must not simply shrink.

It must **reflow, reorganize, collapse, stack, scroll, or transform appropriately depending on available screen width**.

The final result should feel intentionally designed for each screen size rather than being a desktop UI forced into a mobile viewport.

---

# 2. APPLICATION AREAS IN SCOPE

You MUST inspect and remediate both major application areas.

## A. ADMIN UI

Audit every Admin UI page, including but not limited to:

- Admin Dashboard
- Tenant Management
- Tenant Details
- User Management
- Roles
- Permissions
- Subscription Management
- Plans
- System Configuration
- Platform Configuration
- Branch Management
- Product Management
- System-wide Reports
- Audit Logs
- Notifications
- Settings
- Authentication
- Profile
- Any administrative CRUD screens
- Any modal/dialog/drawer workflows
- Any tables and data-heavy screens
- Any charts and analytics
- Any configuration forms
- Any empty/error/loading states

Do not assume the currently visible Admin screens represent the entire Admin UI.

Explore the application and source code to identify all routes, layouts, components, and reusable UI elements.

---

# 3. TENANT UI

Audit every Tenant-facing area, including but not limited to:

- Tenant Dashboard
- POS
- Sales
- Products
- Inventory
- Stock Management
- Categories
- Suppliers
- Customers
- Purchases
- Expenses
- Recipes/BOM
- Ingredients
- Waste
- Pricing
- Profit/Margin views
- Reports
- Branches
- Staff
- Users
- Roles
- Notifications
- Settings
- Profile
- Authentication
- Any operational workflows
- Any modal/dialog/drawer workflows
- Any tables
- Any forms
- Any charts
- Any cards
- Any search/filter interfaces
- Any pagination controls
- Any import/export interfaces
- Any mobile/compact workflows

Again, inspect the actual application and source code instead of relying only on this list.

---

# 4. FIRST PHASE: DISCOVER THE APPLICATION

Before modifying code, perform a complete UI inventory.

Inspect:

- React routes
- Layout components
- Page components
- Shared components
- Navigation components
- Sidebar
- Header
- Footer
- Tables
- Forms
- Cards
- Modals
- Drawers
- Dropdowns
- Tabs
- Pagination
- Charts
- Filters
- Search components
- Buttons
- Inputs
- Selects
- Date pickers
- Toasts/notifications
- Loading states
- Empty states
- Error states
- Authentication screens
- Responsive utility components
- Tailwind configuration
- Ant Design configuration
- CSS files
- Global styles
- Component-specific styles

Identify repeated responsive problems.

Do NOT fix every screen independently if the underlying problem is caused by a shared component.

---

# 5. RESPONSIVE DESIGN PRINCIPLE

Follow this hierarchy:

**Design System → Layout System → Shared Components → Pages → Individual Elements**

Do not solve systemic problems using page-specific hacks.

For example:

If 15 pages have the same overflowing table because the shared table wrapper is incorrectly implemented, fix the shared table architecture rather than adding custom CSS to 15 pages.

If every page has excessive horizontal padding on mobile, fix the common page container.

If the sidebar causes content overflow, fix the application shell.

---

# 6. RESPONSIVE BREAKPOINT STRATEGY

Use responsive behavior based on available space rather than designing exclusively for one device.

At minimum validate:

### Large Desktop
Approximately:

`1920px`

### Desktop
Approximately:

`1440px`

### Laptop
Approximately:

`1280px`

### Small Laptop
Approximately:

`1024px`

### Tablet Landscape
Approximately:

`900px`

### Tablet Portrait
Approximately:

`768px`

### Large Mobile
Approximately:

`430px`

### Standard Mobile
Approximately:

`390px`

### Small Mobile
Approximately:

`360px`

### Narrow Mobile
Approximately:

`320px`

Do not introduce unnecessary breakpoints.

Prefer the existing Tailwind breakpoint system where practical.

Use CSS/layout techniques such as:

- Flexbox
- CSS Grid
- `min-width: 0`
- `max-width`
- `clamp()`
- responsive spacing
- responsive typography
- wrapping
- stacking
- overflow handling
- container queries where appropriate
- responsive visibility
- adaptive component layouts

Avoid arbitrary pixel-based fixes unless they are genuinely required.

---

# 7. MOBILE-FIRST IMPLEMENTATION

Implement responsive behavior using a **mobile-first approach** wherever practical.

Do not treat mobile as a broken desktop layout.

For smaller screens:

- Stack content vertically where appropriate
- Reduce unnecessary spacing
- Collapse navigation
- Convert multi-column layouts into single-column layouts
- Transform wide controls into compact controls
- Make touch targets sufficiently large
- Allow content to scroll where scrolling is the correct UX
- Prevent accidental horizontal page scrolling
- Preserve important information
- Avoid hiding functionality simply to make the UI fit

---

# 8. APPLICATION SHELL

Pay special attention to the global application shell.

Audit:

- Sidebar
- Header
- Top navigation
- Breadcrumbs
- Page container
- Content area
- Footer
- User menu
- Tenant selector
- Notifications
- Search
- Global actions

The application shell must work correctly on small screens.

### Desktop

Use:

Sidebar + Header + Main Content

### Tablet

Consider:

Collapsible sidebar or compact navigation

### Mobile

Use an intentional mobile navigation pattern.

Do not allow the sidebar to simply remain fixed and push the main content outside the viewport.

---

# 9. SIDEBAR REQUIREMENTS

The sidebar must not cause horizontal overflow.

On smaller screens it should transition appropriately.

Possible behavior:

Desktop:

`Permanent Sidebar`

Tablet:

`Collapsible / Compact Sidebar`

Mobile:

`Overlay / Drawer / Mobile Navigation`

Use the application's existing UI architecture where possible.

Do not introduce an entirely different navigation system unless necessary.

Ensure:

- Navigation remains accessible
- Active route is obvious
- Long menu labels do not overflow
- Icons remain aligned
- Submenus work
- Tenant/admin navigation remains distinguishable
- Logout/profile actions remain accessible
- Sidebar does not cover critical content unexpectedly

---

# 10. HEADER RESPONSIVENESS

The header must adapt to available width.

Audit:

- Logo
- Application name
- Search
- Tenant selector
- Notifications
- User profile
- Action buttons
- Breadcrumbs

Do not allow header elements to collide or overflow.

Where necessary:

- Hide secondary labels
- Collapse controls
- Move actions into menus
- Stack elements
- Allow controlled wrapping
- Reduce spacing
- Use icon-only controls where appropriate

Do not remove critical functionality.

---

# 11. PAGE CONTAINERS

Establish consistent responsive page containers.

Avoid patterns such as:

- Fixed-width content
- Excessive fixed padding
- Hard-coded page widths
- `width: 100vw` inside containers
- Components wider than their parent
- Negative margin hacks
- Fixed positioning that breaks on mobile

Ensure:

```text
Viewport
  ↓
Application Shell
  ↓
Responsive Content Container
  ↓
Page Header
  ↓
Page Content
```

The content area must always respect the available viewport width.

---

# 12. RESPONSIVE TABLE STRATEGY

Tables are one of the highest-risk areas.

Audit every table.

Do NOT blindly force every table to become a tiny unreadable mobile table.

Choose the correct strategy per table.

Possible approaches:

### Strategy A
Responsive horizontal scrolling

Use when the table contains many columns that remain important.

### Strategy B
Column prioritization

Keep critical columns and hide/restructure secondary columns.

### Strategy C
Responsive card/list representation

Transform rows into mobile-friendly cards.

### Strategy D
Expandable row details

Show critical information and allow secondary information to expand.

### Strategy E
Hybrid

Use a compact table with horizontal scrolling for specific sections.

Every table must have:

- Controlled overflow
- No page-level horizontal scrolling
- Readable text
- Proper column sizing
- Responsive actions
- Responsive pagination
- Responsive filtering
- Responsive search
- Responsive bulk actions

---

# 13. FORMS

Audit every form.

Forms must work on small screens.

Fix:

- Multi-column forms
- Labels
- Inputs
- Selects
- Date pickers
- Number inputs
- Textareas
- Upload controls
- Checkbox groups
- Radio groups
- Form actions
- Validation messages

Desktop:

```text
Field    Field
Field    Field
Field    Field
```

Mobile:

```text
Field
Field
Field
Field
```

Avoid fields becoming too narrow to use.

Ensure validation messages do not create unexpected horizontal overflow.

---

# 14. MODALS AND DIALOGS

Audit every modal/dialog.

Desktop dialogs may use a constrained width.

On mobile:

- Respect viewport width
- Use appropriate margins
- Allow vertical scrolling
- Keep actions accessible
- Prevent content from being cut off
- Prevent buttons from overflowing
- Handle long forms
- Handle keyboard/input focus correctly

A modal must never extend beyond the viewport.

---

# 15. DRAWERS

Audit all drawers.

Check:

- Width
- Height
- Internal scrolling
- Header
- Footer/actions
- Forms
- Tables
- Nested content

Mobile drawers should use almost the full available width where appropriate, without creating horizontal overflow.

---

# 16. CARDS AND DASHBOARDS

Audit dashboard cards and analytical widgets.

Problems to look for:

- Cards remaining fixed width
- Cards becoming too narrow
- Text overflowing
- Icons overlapping
- Numbers wrapping badly
- Charts exceeding container width
- Grid layouts breaking
- Excessive whitespace

Use responsive grids.

Example concept:

Desktop:

```text
Card | Card | Card | Card
```

Tablet:

```text
Card | Card
Card | Card
```

Mobile:

```text
Card
Card
Card
Card
```

However, use the actual content to determine the appropriate layout.

---

# 17. CHARTS

Charts must respond to their containers.

Audit:

- Width
- Height
- Legends
- Labels
- Tooltips
- Axis labels
- Data points
- Overflow

Never allow a chart library to force the entire page wider than the viewport.

Charts should resize according to their parent container.

---

# 18. SEARCH AND FILTERS

Search/filter sections are common sources of responsive problems.

Desktop may use:

```text
Search | Filter | Filter | Date | Actions
```

Mobile should intelligently become:

```text
Search
Filter
Filter
Date
Actions
```

or an appropriate compact filter interface.

Do not simply allow controls to shrink until they become unusable.

---

# 19. BUTTONS AND ACTIONS

Audit all action groups.

Look for:

- Button overflow
- Buttons becoming too small
- Text wrapping awkwardly
- Icon/text collisions
- Too many actions on one row

Use:

- Wrapping
- Stacking
- Overflow menus
- Icon-only actions where appropriate
- Responsive button widths

Maintain adequate touch targets.

---

# 20. TYPOGRAPHY

Audit typography across all screen sizes.

Check:

- Page titles
- Section headings
- Table text
- Labels
- Buttons
- Navigation
- Cards
- Numbers
- Currency values
- Error messages

Avoid excessive font-size reductions.

Instead use responsive typography.

Important information must remain readable.

---

# 21. LONG CONTENT

Test realistic content.

Do not only test short sample values.

Test:

- Long product names
- Long customer names
- Long tenant names
- Long branch names
- Long usernames
- Long email addresses
- Large currency amounts
- Long descriptions
- Long error messages
- Long menu labels

Ensure text:

- Wraps where appropriate
- Truncates where appropriate
- Provides tooltips/details where needed
- Never causes page-level horizontal overflow

---

# 22. POS INTERFACE

Give special attention to the POS experience.

POS must be usable on:

- Desktop
- Tablet
- Small tablet
- Mobile

Prioritize:

- Product selection
- Search
- Cart
- Quantity controls
- Pricing
- Discounts
- Customer selection
- Payment
- Checkout
- Receipt actions

Do not sacrifice operational speed for visual compactness.

Controls must remain easy to tap.

---

# 23. TOUCH EXPERIENCE

For mobile/tablet:

Ensure interactive controls have appropriate touch targets.

Audit:

- Buttons
- Icons
- Menu items
- Checkboxes
- Radio buttons
- Dropdowns
- Table actions
- Pagination
- Tabs

Avoid placing small clickable icons too close together.

---

# 24. ANT DESIGN + TAILWIND CSS

The project uses:

- React JSX
- TailwindCSS
- Ant Design

Respect the existing architecture.

Do NOT create unnecessary conflicts between Tailwind and Ant Design.

Do not globally override Ant Design styles simply to solve one component's problem.

Prefer:

1. Existing Ant Design responsive behavior
2. Existing Tailwind utilities
3. Component-level styling
4. Shared responsive abstractions

Only introduce global CSS when the behavior genuinely needs to be global.

---

# 25. DO NOT USE THESE FIXES

Avoid:

- Random negative margins
- Arbitrary fixed widths
- `overflow-x: hidden` as a blanket fix
- Hiding content simply because it does not fit
- Excessive media queries
- Duplicate mobile components without justification
- Page-specific hacks for shared problems
- Hard-coded viewport assumptions
- Breaking desktop behavior to fix mobile
- Breaking mobile behavior to fix desktop
- Changing business logic unnecessarily
- Removing functionality to make a screen smaller

Especially:

**Do not use `overflow-x: hidden` to hide responsive bugs.**

The underlying layout problem must be fixed.

---

# 26. HORIZONTAL OVERFLOW AUDIT

Perform a dedicated horizontal overflow audit.

For every major page determine:

```text
Does document width exceed viewport width?
```

Test at:

- 320px
- 360px
- 390px
- 430px
- 768px
- 1024px
- 1280px
- 1440px
- 1920px

Identify the exact element responsible for overflow.

Common causes to investigate:

- Fixed widths
- `min-width`
- Long strings
- Tables
- Flex children without `min-width: 0`
- Images
- SVGs
- Charts
- Dropdowns
- Modals
- Drawers
- Buttons
- Navigation
- Grid columns
- Absolute positioning

Fix the source rather than hiding the symptom.

---

# 27. VISUAL CONSISTENCY

While fixing responsiveness, maintain a consistent design system.

Do not create:

- One mobile style for Admin
- Another unrelated mobile style for Tenant

Both should feel like the same ThamaniCraft platform.

Maintain consistency in:

- Spacing
- Typography
- Colors
- Border radius
- Shadows
- Buttons
- Form controls
- Cards
- Tables
- Navigation
- Responsive behavior

---

# 28. ACCESSIBILITY

Use responsive remediation as an opportunity to improve accessibility.

Check:

- Keyboard navigation
- Focus states
- Screen-reader labels
- Semantic HTML
- Button vs clickable div
- Form labels
- Color contrast
- Touch targets
- Modal focus management
- Mobile menu accessibility

Do not sacrifice accessibility for visual compactness.

---

# 29. PERFORMANCE

Do not introduce unnecessarily heavy responsive logic.

Avoid:

- Excessive JavaScript viewport detection
- Rendering duplicate page trees unnecessarily
- Expensive resize listeners
- Large client-side layout calculations

Prefer CSS media queries and responsive layout primitives whenever possible.

Use JavaScript only where behavior genuinely requires it.

---

# 30. SHARED RESPONSIVE COMPONENTS

If recurring problems are identified, create reusable abstractions.

Potential examples:

```text
ResponsivePageContainer
ResponsivePageHeader
ResponsiveGrid
ResponsiveTable
ResponsiveFilterBar
ResponsiveActionGroup
ResponsiveModal
ResponsiveDrawer
ResponsiveCardGrid
MobileNavigation
```

Do not create components merely for the sake of abstraction.

Create them when they solve repeated architectural problems.

---

# 31. ADMIN VS TENANT NAVIGATION

Ensure the two application experiences remain clearly separated.

Admin users should not get a confusing Tenant navigation experience.

Tenant users should not see unnecessary Admin navigation.

Both navigation systems must remain responsive.

---

# 32. AUTHENTICATION SCREENS

Audit:

- Login
- Registration
- Password reset
- MFA/verification if present
- Tenant selection
- Session-related screens

These must work particularly well on small screens.

Avoid oversized authentication panels that force scrolling on small devices.

---

# 33. EMPTY, LOADING, ERROR AND SUCCESS STATES

Responsive behavior must also work for:

- Empty tables
- Empty dashboards
- Loading skeletons
- Error messages
- Validation errors
- Success messages
- Notifications
- Confirmation dialogs

Do not only test populated pages.

---

# 34. DATA-DENSE SCREENS

ThamaniCraft is a business application.

Some screens naturally contain significant amounts of information.

Do NOT attempt to make every data-dense screen completely vertical.

Instead determine the correct UX pattern.

For each dense screen ask:

> What information is essential at this viewport size?

Then design the responsive hierarchy accordingly.

---

# 35. RESPONSIVE UX RULE

Use this decision hierarchy:

### If content can naturally reflow:
Reflow it.

### If content can stack:
Stack it.

### If secondary information can collapse:
Collapse it.

### If a table cannot reasonably transform:
Use controlled horizontal scrolling.

### If an action is secondary:
Move it into an overflow menu.

### If navigation is too large:
Collapse navigation.

### If content is genuinely too wide:
Allow controlled component-level scrolling.

### Never:
Let the entire application page overflow horizontally.

---

# 36. IMPLEMENTATION PROCESS

Follow this sequence.

## STEP 1
Inspect the entire codebase.

## STEP 2
Identify all routes and application areas.

## STEP 3
Identify shared layout/components.

## STEP 4
Run the application.

## STEP 5
Audit the UI at multiple viewport sizes.

## STEP 6
Create a responsive issue inventory.

Categorize issues:

```text
CRITICAL
HIGH
MEDIUM
LOW
```

## STEP 7
Fix global architecture problems first.

Priority:

```text
Application Shell
↓
Navigation
↓
Page Container
↓
Shared Components
↓
Tables
↓
Forms
↓
Modals/Drawers
↓
Dashboards
↓
Individual Pages
```

## STEP 8
Validate each change against desktop and mobile.

## STEP 9
Perform a complete regression pass.

## STEP 10
Perform a final responsive audit.

---

# 37. RESPONSIVE TEST MATRIX

Use this matrix as the minimum validation standard.

| Viewport | Primary Purpose |
|---|---|
| 1920 × 1080 | Large desktop |
| 1440 × 900 | Desktop |
| 1280 × 800 | Laptop |
| 1024 × 768 | Small laptop/tablet |
| 900 × 768 | Tablet landscape |
| 768 × 1024 | Tablet portrait |
| 430 × 932 | Large mobile |
| 390 × 844 | Standard mobile |
| 360 × 800 | Small mobile |
| 320 × 700 | Narrow mobile |

For each viewport verify:

- No unintended horizontal scrolling
- Navigation works
- Header works
- Page title works
- Forms work
- Tables work
- Cards work
- Charts work
- Modals work
- Drawers work
- Buttons work
- Search works
- Filters work
- Pagination works
- Notifications work
- Empty states work
- Error states work
- Touch targets work

---

# 38. VISUAL REGRESSION

Before considering the work complete, compare:

```text
Desktop Before
Desktop After

Tablet Before
Tablet After

Mobile Before
Mobile After
```

Make sure responsive improvements do not introduce desktop regressions.

---

# 39. CODE QUALITY REQUIREMENTS

All changes must:

- Follow existing project conventions
- Use React JSX
- Preserve existing functionality
- Preserve business logic
- Avoid unnecessary dependencies
- Avoid duplicate code
- Avoid temporary hacks
- Keep components maintainable
- Keep styling understandable
- Prefer reusable responsive patterns

Do not rewrite unrelated application functionality.

---

# 40. DO NOT STOP AT THE FIRST SCREEN

This is critical.

Do not fix the dashboard and declare the application responsive.

The requirement is:

**EVERY UI AREA**

You must continue through the entire Admin and Tenant application.

If the application contains 30 pages, audit all 30.

If it contains 50 pages, audit all 50.

If multiple routes use the same component, test the component across all relevant contexts.

---

# 41. FINAL QUALITY GATE

Do not consider the work complete until all of the following are true:

### Layout

- No unintended horizontal page overflow
- No clipped content
- No overlapping components
- No broken grids
- No unusable narrow controls

### Navigation

- Admin navigation works on all target sizes
- Tenant navigation works on all target sizes
- Mobile navigation is usable
- Active states remain clear

### Forms

- All forms work on mobile
- Inputs remain usable
- Validation remains readable
- Form actions remain accessible

### Tables

- All tables have an intentional mobile strategy
- No unreadable compressed tables
- No uncontrolled page overflow

### Dialogs

- All modals fit mobile screens
- All drawers work
- Content scrolls correctly

### Dashboards

- Cards reflow correctly
- Charts resize correctly
- Metrics remain readable

### POS

- POS remains operationally usable on small screens
- Product selection works
- Cart works
- Checkout works

### Accessibility

- Keyboard navigation works
- Focus states remain visible
- Touch targets are usable
- Labels remain accessible

### Regression

- Desktop remains correct
- Tablet remains correct
- Mobile remains correct

---

# 42. FINAL REPORT

After implementation, produce a concise report containing:

## Responsive UI Remediation Summary

### 1. Total Areas Audited
Number of Admin and Tenant screens/components audited.

### 2. Major Problems Identified
List the major responsive problems discovered.

### 3. Major Fixes
Describe the architectural and component-level fixes.

### 4. Shared Components Improved
List reusable components that were improved.

### 5. Admin UI
Summarize Admin UI responsive improvements.

### 6. Tenant UI
Summarize Tenant UI responsive improvements.

### 7. POS
Summarize POS responsive improvements.

### 8. Breakpoints
Document the responsive strategy used.

### 9. Validation
Report which viewport sizes were tested.

### 10. Remaining Issues
Clearly identify anything that could not be resolved.

Do not claim 100% responsive compliance unless it was actually validated.

---

# 43. IMPORTANT WORKING PRINCIPLE

Do not approach this task as:

> Make the current desktop UI fit on mobile.

Approach it as:

> **Design and implement a responsive ThamaniCraft experience that intelligently adapts its information architecture, navigation, components, and interactions to the available screen size while preserving functionality and visual consistency.**

The final result should feel like a **professional production-grade business application on every supported screen size**.

---

# 44. DEFINITION OF DONE

The task is complete only when:

**Admin UI + Tenant UI + POS + Shared Components + Navigation + Forms + Tables + Dashboards + Modals + Drawers + Reports + Settings + Authentication + Operational Workflows**

have all been audited and validated for responsive behavior.

The goal is not merely:

```text
No horizontal scrollbar
```

The goal is:

```text
Correct Layout
+
Correct Information Hierarchy
+
Correct Navigation
+
Correct Interaction
+
Correct Touch Experience
+
Correct Accessibility
+
Correct Desktop Behavior
+
Correct Mobile Behavior
=
Production-Ready Responsive ThamaniCraft UI
```

Begin by inspecting the application and creating the responsive issue inventory.

**Do not start by randomly changing CSS.**

First understand the architecture, identify systemic problems, then implement the fixes in priority order.