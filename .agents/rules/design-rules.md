---
name: design-rules
version: 1.0.0
priority: P0
trigger: glob
globs: "**/*.{tsx,jsx,vue,svelte,css,scss},**/components/**,**/app/**/page.tsx"
---

# Design Rules (TIER 2) - AG Kit

> Loaded when touching UI files. Design rules live in the specialist agents, NOT here.

## 🛑 GATE: DESIGN.md before any UI code (MANDATORY)

Before writing or editing UI (components, pages, styles — web or mobile), a **`DESIGN.md` must exist at the project root**.

1. **Check** for `DESIGN.md` at the project root.
2. **If missing:** infer the design direction from the brief, then **create `DESIGN.md` first** (tokens + rationale) following the `design-spec` skill. Do not write UI code until it exists.
3. **If present:** READ it and build strictly against its tokens. Descriptive names in prose map to token names.
4. **Keep it in sync** when the visual language changes — it is the single source of truth.

> Exception: none for new UI. A genuinely trivial tweak to existing UI (one button color, a spacing nudge) may proceed if a `DESIGN.md` already governs the project. Net-new UI always requires the gate.

| Need | Read |
| ---- | ---- |
| DESIGN.md format / tokens | `.agents/skills/design-spec/SKILL.md` |

---

| Task         | Read                            |
| ------------ | ------------------------------- |
| Web UI/UX    | `.agents/agent/frontend-specialist.md` |
| Mobile UI/UX | `.agents/agent/mobile-developer.md`    |

**These agents contain:**

- Purple Ban (no purple by default — brand/brief override allowed)
- Template Ban (no standard layouts)
- Anti-cliché rules
- Deep Design Thinking protocol

> 🔴 **For design work:** Open and READ the agent file. Rules are there.

## 📐 Global Layout and Responsiveness Rules

1. **Modal Sizing & Layout**: 
   - All modals must be carefully sized to prevent vertical scrolling. 
   - Optimize the use of horizontal space (e.g., placing fields side-by-side using Grids or Flexbox) instead of stacking them vertically endlessly.
   
2. **Table Constraints**: 
   - Tables must NOT require horizontal scrolling. 
   - Handle wide content gracefully via ellipses, fixed column layouts, or collapsing columns on smaller screens. 
   - *Never* force the user to scroll horizontally to see the end of a table.

3. **Responsiveness**:
   - Every page and component must be designed with smaller screens (mobile/tablet) in mind.
   - Use responsive grid systems (e.g. Tailwind `grid-cols-1 md:grid-cols-2`) and breakpoint utilities appropriately.
