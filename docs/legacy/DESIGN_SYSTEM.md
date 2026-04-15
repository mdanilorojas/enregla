# EnRegla Design System

> **Generated:** 2026-04-10  
> **Product Type:** Government Compliance & Regulatory Management Platform  
> **Stack:** React + TypeScript + Vite + Tailwind CSS

---

## 🎨 Design System Overview

### Visual Identity

**Style:** Trust & Authority  
Perfect for government, financial, and enterprise software that requires credibility and professionalism.

**Pattern:** Real-Time / Operations Landing  
Designed for operational tools with live data, metrics, and status monitoring.

---

## 📐 Core Design Tokens

### Colors

| Role | Hex | Tailwind | Usage |
|------|-----|----------|--------|
| **Primary** | `#2563EB` | `blue-600` | Main brand color, primary actions |
| **Secondary** | `#3B82F6` | `blue-500` | Secondary actions, accents |
| **CTA** | `#F97316` | `orange-500` | Call-to-action buttons, alerts |
| **Background** | `#F8FAFC` | `slate-50` | Page background |
| **Text** | `#1E293B` | `slate-800` | Primary text |

**Color Strategy:**
- Professional navy blue conveys trust and authority
- Orange CTA provides strong contrast for important actions
- Light neutral background keeps data readable
- Use status colors: green (approved), amber (pending), red (rejected)

### Typography

**Heading Font:** Fira Code  
**Body Font:** Fira Sans

```css
@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Fira+Sans:wght@300;400;500;600;700&display=swap');

/* Usage */
.heading {
  font-family: 'Fira Code', monospace;
  font-weight: 600;
}

.body {
  font-family: 'Fira Sans', sans-serif;
  font-weight: 400;
  line-height: 1.6;
}
```

**Why this pairing?**  
Fira Code for headings gives a technical, precise feel perfect for regulatory/compliance tools. Fira Sans for body text ensures excellent readability for document-heavy content.

### Spacing Scale (8pt System)

Use Tailwind's spacing scale consistently:

| Token | Tailwind | Value | Usage |
|-------|----------|-------|-------|
| xs | `space-1` | 4px | Tight gaps, icon spacing |
| sm | `space-2` | 8px | Small padding |
| md | `space-4` | 16px | Standard padding |
| lg | `space-6` | 24px | Section padding |
| xl | `space-8` | 32px | Large gaps |
| 2xl | `space-12` | 48px | Section margins |
| 3xl | `space-16` | 64px | Hero padding |

### Shadows

```css
/* Tailwind classes */
shadow-sm  /* Subtle lift for inputs */
shadow-md  /* Cards, elevated elements */
shadow-lg  /* Modals, dropdowns */
shadow-xl  /* Hero sections, featured content */
```

---

## 🧩 Component Patterns

### Buttons

```tsx
// Primary CTA (important actions like "Submit Permit")
<button className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
  Submit Application
</button>

// Secondary (less important actions)
<button className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold px-6 py-3 rounded-lg transition-all duration-200">
  View Details
</button>

// Destructive (delete, reject)
<button className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200">
  Reject Application
</button>
```

### Cards (Permit Cards, Document Cards)

```tsx
<div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer border border-slate-200">
  <h3 className="font-['Fira_Code'] font-semibold text-lg text-slate-800 mb-2">
    Permit #12345
  </h3>
  <p className="font-['Fira_Sans'] text-slate-600 mb-4">
    Commercial Operating License
  </p>
  {/* Status badge */}
  <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
    Approved
  </span>
</div>
```

### Forms (Critical for Compliance)

```tsx
<div className="space-y-2">
  {/* Always use visible labels, not placeholder-only */}
  <label htmlFor="permit-type" className="block text-sm font-medium text-slate-700">
    Permit Type <span className="text-red-500">*</span>
  </label>
  
  <input
    id="permit-type"
    type="text"
    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
    placeholder="e.g., Commercial Operating License"
  />
  
  {/* Error message below field */}
  {error && (
    <p className="text-sm text-red-600 flex items-center gap-1">
      <AlertIcon className="w-4 h-4" />
      {error}
    </p>
  )}
  
  {/* Helper text */}
  <p className="text-sm text-slate-500">
    Select the type of permit you're applying for
  </p>
</div>
```

### Data Tables (for Permit Lists)

```tsx
<div className="overflow-x-auto">
  <table className="w-full border-collapse">
    <thead>
      <tr className="border-b-2 border-slate-200">
        <th className="text-left py-4 px-4 font-['Fira_Code'] font-semibold text-slate-700">
          Permit ID
        </th>
        <th className="text-left py-4 px-4 font-['Fira_Code'] font-semibold text-slate-700">
          Type
        </th>
        <th className="text-left py-4 px-4 font-['Fira_Code'] font-semibold text-slate-700">
          Status
        </th>
      </tr>
    </thead>
    <tbody>
      {/* Use stable IDs as keys, NOT array index */}
      {permits.map(permit => (
        <tr key={permit.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
          <td className="py-4 px-4 font-['Fira_Sans']">{permit.id}</td>
          <td className="py-4 px-4 font-['Fira_Sans']">{permit.type}</td>
          <td className="py-4 px-4">
            <StatusBadge status={permit.status} />
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

### Loading States

```tsx
// Skeleton loader for data tables (loading >300ms)
<div className="animate-pulse space-y-4">
  <div className="h-12 bg-slate-200 rounded"></div>
  <div className="h-12 bg-slate-200 rounded"></div>
  <div className="h-12 bg-slate-200 rounded"></div>
</div>

// Button loading state
<button disabled={loading} className="...">
  {loading ? (
    <span className="flex items-center gap-2">
      <Spinner className="w-4 h-4 animate-spin" />
      Processing...
    </span>
  ) : (
    'Submit'
  )}
</button>
```

### Modals (for Permit Details, Confirmations)

```tsx
<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
  <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
    <div className="flex justify-between items-start mb-6">
      <h2 className="font-['Fira_Code'] text-2xl font-bold text-slate-800">
        Permit Details
      </h2>
      <button className="text-slate-400 hover:text-slate-600 transition-colors">
        <CloseIcon className="w-6 h-6" />
      </button>
    </div>
    
    {/* Modal content */}
    <div className="space-y-4">
      {/* ... */}
    </div>
  </div>
</div>
```

---

## 🎯 UX Best Practices for Compliance Tools

### 1. **Forms & Validation** (Critical)

✅ **Do:**
- Show errors **below the field**, not just at the top
- Validate on `onBlur`, not on every keystroke
- Mark required fields with asterisk (*) and clear label
- Provide helper text for complex fields
- Disable submit button during processing + show loading state

❌ **Don't:**
- Use placeholder-only labels (accessibility issue)
- Validate only on submit (user sees all errors at once)
- Let users double-submit (disable button during async)

### 2. **Data Tables** (High Priority)

✅ **Do:**
- Use horizontal scroll (`overflow-x-auto`) for mobile
- Provide bulk actions (select multiple permits, bulk approve)
- Use stable IDs as `key` prop, not array index
- Show empty state with helpful message and action

❌ **Don't:**
- Break layout on mobile (wide tables overflow)
- Force users to edit one by one (tedious for admins)

### 3. **Loading States** (Required)

✅ **Do:**
- Show skeleton/spinner for operations >300ms
- Disable buttons during async operations
- Use `font-display: swap` for web fonts

❌ **Don't:**
- Leave UI frozen with no feedback
- Allow button clicks during loading
- Show blank screen while loading

### 4. **Accessibility** (Legal Requirement)

✅ **Do:**
- Maintain 4.5:1 contrast ratio for text
- Show visible focus states for keyboard navigation
- Use semantic HTML (`<label>`, `<button>`, not `<div onClick>`)
- Respect `prefers-reduced-motion`

❌ **Don't:**
- Use emojis as structural icons
- Hide focus rings (accessibility requirement)
- Convey information by color alone

---

## ⚡ Performance Guidelines (React)

### 1. **List Performance**

For large permit lists (100+ items), consider virtualization:

```tsx
import { useVirtualizer } from '@tanstack/react-virtual'

// Renders only visible rows, not all 1000+ permits
```

### 2. **Avoid Unnecessary Re-renders**

```tsx
// ✅ Good: Stable keys
{permits.map(permit => <PermitCard key={permit.id} {...permit} />)}

// ❌ Bad: Index as key (causes re-renders on sort/filter)
{permits.map((permit, i) => <PermitCard key={i} {...permit} />)}
```

### 3. **Image Optimization**

```tsx
// Use lazy loading for permit thumbnails
<img
  src={permit.thumbnail}
  loading="lazy"
  alt={`Thumbnail for permit ${permit.id}`}
  className="w-full h-48 object-cover rounded-lg"
/>
```

### 4. **Profile Before Optimizing**

Use React DevTools Profiler to identify bottlenecks before adding `useMemo`/`useCallback`.

---

## 🚀 Page Structure Guidelines

### Landing Page (Public)

**Section Order:**
1. **Hero** - Product name + live preview/demo or system status
2. **Key Metrics** - Number of permits processed, average approval time, trust indicators
3. **How It Works** - 3-4 step process
4. **CTA** - "Start Trial" or "Contact Sales"

### Dashboard (Authenticated)

**Layout:**
- Fixed top navbar (project selector, search, user menu)
- Sidebar navigation (Permits, Regulations, Network Map, Settings)
- Main content area with breadcrumbs
- Status indicators (pending approvals, notifications)

### Permit Detail View

**Structure:**
- Header: Permit ID, status badge, actions (Edit, Download, Delete)
- Metadata section: Type, applicant, dates, location
- Document preview/list
- Timeline/history
- Related permits (network visualization)

---

## 📋 Pre-Delivery Checklist

Before pushing any UI code, verify:

- [ ] No emojis used as icons (use Heroicons/Lucide SVG)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Text contrast ≥4.5:1 (use WebAIM contrast checker)
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive breakpoints: 375px (mobile), 768px (tablet), 1024px (desktop), 1440px (large)
- [ ] No horizontal scroll on mobile
- [ ] Loading states for operations >300ms
- [ ] Error messages below related fields
- [ ] Form labels visible (not placeholder-only)

---

## 🎨 Design System Files

**Master File:**  
`C:\Users\Danilo Rojas\.claude\skills\ui-ux-pro-max\design-system\enregla\MASTER.md`

**Page-Specific Overrides:**  
When building a specific page (e.g., Dashboard, Permit Detail), create:  
`C:\Users\Danilo Rojas\.claude\skills\ui-ux-pro-max\design-system\enregla\pages\[page-name].md`

Page-specific rules override the Master file.

---

## 🔗 Resources

- **Google Fonts:** [Fira Code + Fira Sans](https://fonts.google.com/share?selection.family=Fira+Code:wght@400;500;600;700|Fira+Sans:wght@300;400;500;600;700)
- **Icon Library:** [Heroicons](https://heroicons.com/) or [Lucide](https://lucide.dev/)
- **Tailwind CSS:** Already configured in your project
- **WebAIM Contrast Checker:** https://webaim.org/resources/contrastchecker/

---

## 🎯 Key Takeaways

1. **Trust & Authority** - Your design should convey professionalism and credibility (government context)
2. **Data-Dense but Scannable** - Use spacing, typography hierarchy, and status colors to make complex information digestible
3. **Performance Matters** - Compliance tools often have large datasets; use virtualization and lazy loading
4. **Accessibility is Required** - Government tools must meet WCAG standards
5. **Consistent Status Colors** - Green (approved), Amber (pending), Red (rejected/expired)

---

**Need more guidance?** Use the UI/UX Pro Max skill:

```bash
# Search for specific UX guidelines
python3 skills/ui-ux-pro-max/scripts/search.py "data-visualization charts" --domain ux

# Get React performance tips
python3 skills/ui-ux-pro-max/scripts/search.py "performance optimization" --stack react
```
