# Dashboard Horizontal Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the dashboard layout into the "Héroe Horizontal Fino + Columnas" design, making the compliance weather card a slim, full-width horizontal banner and restructuring the bottom area into a two-column layout (locations on the left, actions on the right).

**Architecture:** 
1. Modify `ComplianceWeatherCard.tsx` to support horizontal flex layout, reducing height from 340px to ~120px on desktop and adjusting element sizing.
2. Modify `DashboardView.tsx` to place the `ComplianceWeatherCard` as a full-width header block and structure the rest of the workspace in a 12-column grid (`lg:col-span-8` for locations list, `lg:col-span-4` for action hub card).
3. Ensure responsiveness and strict conformance to the clear-only, Atlassian-based design system tokens.

## Global Constraints
- Single-mode clear only.
- Strict use of design system tokens (e.g. `text-[var(--ds-font-size-100)]` for base text, `text-[var(--ds-font-size-075)]` for small detail text).
- Re-use `{ Card }` from `@/components/ui/card` and `{ Button }` from `@/components/ui/button`.
- No scale/elevate effects on hover.
- Keep weather canvas particles and animations intact.

---

### Task 1: Refactor `ComplianceWeatherCard.tsx` to Horizontal Layout

**Files:**
- Modify: `src/components/ui/ComplianceWeatherCard.tsx`

**Interfaces:**
- Consumes: `ComplianceWeatherCardProps` (unchanged structure)
- Produces: Updated layout and CSS styling for `ComplianceWeatherCard`

- [ ] **Step 1: Check TypeScript compiler output before modification**
  Run: `npm run typecheck`
  Expected: Success or existing issues only.

- [ ] **Step 2: Modify the JSX structure and class styles**
  Open [ComplianceWeatherCard.tsx](file:///C:/dev/enregla/src/components/ui/ComplianceWeatherCard.tsx) and reorganize the return markup of `ComplianceWeatherCardImpl`.
  Specifically, change the layout under the `.content` div to allow:
  1. A left-side content block for the chip and the headline.
  2. A right-side content block for the percentage value and data pill or action button.
  Let's keep the content compact so it can fit in `120px-130px` height.
  Update the CSS styles at the bottom of the file (lines 383-642) to adjust the height, padding, flex direction, and font size:
  - Change `.hero-card` and `.hero-card .content` min-height to `130px` (or `120px` on desktop, auto on mobile).
  - Adjust `.hero-stats` and `.big-pct` sizing from `120px` to `text-4xl` or `text-5xl` (`~40px-48px`) to fit horizontally.
  - Update `.hero-card .content` to display as `flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-6`.
  - Add a sutil horizontal layout CSS styling.

- [ ] **Step 3: Run typescript check to verify types**
  Run: `npm run typecheck`
  Expected: SUCCESS

- [ ] **Step 4: Commit the changes**
  Run:
  ```bash
  git add src/components/ui/ComplianceWeatherCard.tsx
  git commit -m "feat(dashboard): refactor compliance weather card to horizontal slim layout"
  ```

---

### Task 2: Reorganize `DashboardView.tsx` Layout

**Files:**
- Modify: `src/features/dashboard/DashboardView.tsx`

**Interfaces:**
- Consumes: `ComplianceWeatherCard` (updated style), `DashboardLocationCard`, `ActionItemRow`
- Produces: Updated grid layout for the main dashboard view

- [ ] **Step 1: Modify the core JSX layout**
  Open [DashboardView.tsx](file:///C:/dev/enregla/src/features/dashboard/DashboardView.tsx) and modify the layout starting from line 283:
  1. Pull the `<ComplianceWeatherCard ... />` component OUT of the `grid` so that it renders full-width at the top, directly after the header section and onboarding checklist.
  2. Change the grid container to:
     `<div className="grid grid-cols-1 lg:grid-cols-12 gap-[var(--ds-space-200)] lg:gap-[var(--ds-space-300)] items-start">`
  3. Place the locations grid inside a left column wrapper spanning 7 or 8 columns on large screens:
     `<div className="lg:col-span-7 xl:col-span-8 space-y-[var(--ds-space-150)]">`
     Inside it, render the header "Tus Locales y Estado por Sede" and the locations grid using:
     `<div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--ds-space-200)] lg:gap-[var(--ds-space-300)]">`
  4. Place the Action Hub card inside a right column wrapper spanning 5 or 4 columns on large screens:
     `<div className="lg:col-span-5 xl:col-span-4">`
     Inside it, render the existing `<Card className="...">` with "Acciones Requeridas".

- [ ] **Step 2: Run verification checks**
  Run: `npm run typecheck`
  Expected: SUCCESS
  Run: `npm run build`
  Expected: SUCCESS

- [ ] **Step 3: Commit the changes**
  Run:
  ```bash
  git add src/features/dashboard/DashboardView.tsx
  git commit -m "feat(dashboard): restructure main view to horizontal hero and 2-column workspace"
  ```
