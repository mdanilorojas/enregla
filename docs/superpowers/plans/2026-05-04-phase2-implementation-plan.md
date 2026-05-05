# Phase 2 Implementation Plan

**Created**: 2026-05-04  
**Status**: Ready to Execute  
**Duration**: 4-6 weeks  
**Goal**: Migrate remaining UI v1 features to v2, improve UX, eliminate technical debt

---

## Executive Summary

This plan implements Phase 2 of the EnRegla roadmap, focusing on:
- Migrating 4 critical legacy features (Legal, Renewals, Tasks, Permits UX)
- Improving Documents Vault with bulk upload
- Fixing Network Map performance issues
- Cleaning up technical debt

**Current Status:**
- ✅ MVP 1.0 shipped (2026-04-20)
- ✅ Build fixed and passing
- ✅ Core features functional (Dashboard, Locations, Permits, Public Links, Network Map)
- ❌ 4 features still in UI v1 (Legal, Renewals, Tasks, Documents)

---

## Project Structure Analysis

### Current Codebase Metrics
- **Total Lines of Code**: 17,544 lines (TypeScript + TSX)
- **Feature Modules**: 15 directories under `src/features/`
- **Custom Hooks**: 7 hooks in `src/hooks/`
- **Library Modules**: 15 modules in `src/lib/`
- **Database Migrations**: 18 migrations
- **Components**: 40+ shadcn/ui components integrated
- **Console Logs**: 71 occurrences (needs cleanup)

### Architecture
```
src/
├── features/
│   ├── auth/              ✅ v2 (Login, OAuth)
│   ├── dashboard/         ✅ v2 (Metrics, Risk Overview)
│   ├── locations/         ✅ v2 (CRUD, Risk Scoring)
│   ├── network/           ✅ v3 (Static Layout)
│   ├── permits/           ⚠️  Partially v2 (needs UX improvements)
│   ├── public-links/      ✅ v2 (QR Codes, Verification)
│   ├── settings/          ✅ v2 (Notifications)
│   ├── onboarding-incremental/ ✅ v2
│   ├── design-system/     ✅ v2
│   ├── legal/             ❌ v1 (NEEDS MIGRATION)
│   ├── renewals/          ❌ v1 (NEEDS MIGRATION)
│   ├── tasks/             ❌ v1 (NEEDS MIGRATION)
│   └── documents/         ❌ v1 (NEEDS IMPROVEMENT)
│
├── components/
│   ├── ui/               ✅ shadcn/ui components
│   ├── layout/           ✅ AppLayout with sidebar
│   └── Auth/             ✅ ProtectedRoute
│
├── hooks/
│   ├── useAuth.ts        ✅ Authentication state
│   ├── useLocations.ts   ✅ Locations CRUD
│   ├── usePermits.ts     ✅ Permits CRUD
│   └── ...               ✅ Other hooks
│
└── lib/
    ├── api/              ✅ Supabase API wrappers
    ├── supabase.ts       ✅ Client setup
    ├── risk.ts           ✅ Risk calculation
    └── ...               ✅ Utilities
```

---

## Phase 2 Milestones

### Milestone 1: Marco Legal v2 (Week 1-2)
**RICE Score**: 13.3 | **Priority**: P0 | **Duration**: 1.5 weeks

#### Current State
- File: `src/features/legal/LegalReferenceView.tsx`
- Status: Basic UI v1, no database integration
- Issues: Hardcoded data, old components

#### Target State
- Migrate to modern component structure
- Create `legal_references` table in Supabase
- Add search and filtering
- Industry-specific normatives

#### Implementation Tasks

**1.1 Database Schema** (2 hours)
```sql
CREATE TABLE legal_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  industry TEXT NOT NULL, -- 'alimentos', 'retail', 'turismo', etc.
  permit_types TEXT[], -- Related permit types
  authority TEXT, -- 'Ministerio de Turismo', 'Bomberos', etc.
  url TEXT, -- Official source URL
  country TEXT DEFAULT 'EC',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies (public read)
CREATE POLICY "Public read legal references"
  ON legal_references FOR SELECT
  USING (true);

-- Seed data (20+ key regulations)
INSERT INTO legal_references (title, industry, permit_types, authority, url) VALUES
  ('Ley de Turismo', 'turismo', ARRAY['licencia_turismo'], 'Ministerio de Turismo', 'https://...'),
  ('Código de Comercio', 'retail', ARRAY['patente_municipal'], 'Municipio', 'https://...'),
  -- ... 18 more entries
;
```

**1.2 API Layer** (1 hour)
```typescript
// src/lib/api/legalReferences.ts
export async function getLegalReferences(filters?: {
  industry?: string;
  permitType?: string;
  country?: string;
}) {
  let query = supabase.from('legal_references').select('*');
  
  if (filters?.industry) query = query.eq('industry', filters.industry);
  if (filters?.permitType) query = query.contains('permit_types', [filters.permitType]);
  if (filters?.country) query = query.eq('country', filters.country);
  
  const { data, error } = await query.order('title');
  if (error) throw error;
  return data;
}
```

**1.3 Frontend Components** (6 hours)
```typescript
// src/features/legal/LegalReferencesView.tsx
- Search bar (by title/description)
- Industry filter dropdown
- Permit type filter
- Grid of reference cards
- Click to expand with details + external link
- Empty state when no results

// src/features/legal/ReferenceCard.tsx
- Badge with industry color
- Title + description preview
- Authority badge
- "Ver más" button → modal with full details
```

**1.4 Integration** (1 hour)
- Add route to `App.tsx`
- Update sidebar navigation
- Test with seed data

**1.5 Testing** (1 hour)
- Search functionality
- Filters working correctly
- External links open
- Mobile responsive

**Success Criteria:**
- ✅ 20+ legal references in database
- ✅ Search works in < 100ms
- ✅ Filters functional
- ✅ 30%+ users access monthly (track via analytics)

---

### Milestone 2: Renovaciones v2 (Week 2-3)
**RICE Score**: 11.4 | **Priority**: P0 | **Duration**: 1.4 weeks

#### Current State
- File: `src/features/renewals/RenewalTimelineView.tsx`
- Status: Basic table view
- Issues: No timeline visualization, no batch actions

#### Target State
- Visual timeline (30/60/90 days ahead)
- Batch renewal modal
- Status badges (urgent/upcoming/ok)
- Email reminder integration (Phase 3)

#### Implementation Tasks

**2.1 Data Model** (1 hour)
No new tables needed - use existing `permits` table:
```typescript
// src/hooks/useRenewals.ts
export function useRenewals(companyId: string) {
  const { permits } = usePermits({ companyId });
  
  const upcoming = useMemo(() => {
    return permits
      .filter(p => p.expiry_date && daysUntil(p.expiry_date) <= 90)
      .sort((a, b) => new Date(a.expiry_date!).getTime() - new Date(b.expiry_date!).getTime());
  }, [permits]);
  
  return {
    next30: upcoming.filter(p => daysUntil(p.expiry_date!) <= 30),
    next60: upcoming.filter(p => daysUntil(p.expiry_date!) <= 60 && daysUntil(p.expiry_date!) > 30),
    next90: upcoming.filter(p => daysUntil(p.expiry_date!) > 60),
  };
}
```

**2.2 Timeline Component** (8 hours)
```typescript
// src/features/renewals/RenewalTimeline.tsx
- Three columns: 30 days / 60 days / 90 days
- Each column: Card list with permits
- Card shows:
  - Permit type
  - Location name (link)
  - Days until expiry
  - Urgency badge
  - Quick renew button
- Batch select checkboxes
- "Renovar seleccionados" button at top

// src/features/renewals/BatchRenewalModal.tsx
- Shows selected permits list
- Date picker for new expiry (applies to all)
- Confirm button
- Bulk update via Promise.all()
```

**2.3 UI Components** (4 hours)
```typescript
// Timeline card styling
<Card className={cn(
  "hover:shadow-md transition-shadow",
  daysLeft <= 7 && "border-red-500 bg-red-50",
  daysLeft <= 30 && daysLeft > 7 && "border-yellow-500 bg-yellow-50",
)}>
  <CardContent className="p-4">
    <div className="flex justify-between items-start">
      <div>
        <h4 className="font-semibold">{permit.type}</h4>
        <p className="text-sm text-gray-600">{location.name}</p>
      </div>
      <Badge variant={getUrgencyVariant(daysLeft)}>
        {daysLeft} días
      </Badge>
    </div>
    <Button size="sm" onClick={() => setRenewModalOpen(permit.id)}>
      Renovar
    </Button>
  </CardContent>
</Card>
```

**2.4 Integration** (1 hour)
- Replace old `RenewalTimelineView` entirely
- Update route
- Test batch renewal

**2.5 Testing** (1 hour)
- Timeline renders correctly
- Batch renewal works
- Urgency badges correct
- Mobile layout responsive

**Success Criteria:**
- ✅ Timeline shows 30/60/90 day buckets
- ✅ Batch renewal functional
- ✅ 50%+ permits renewed on-time (< 7 days overdue)

---

### Milestone 3: Tareas v2 (Week 3-4)
**RICE Score**: 8.0 | **Priority**: P0 | **Duration**: 1.0 week

#### Current State
- File: `src/features/tasks/TaskBoardView.tsx`
- Status: Basic task list
- Issues: No Kanban, no assignments

#### Target State
- Kanban board (To Do / In Progress / Done)
- Assign tasks to users
- Link tasks → permits
- Drag & drop (optional nice-to-have)

#### Implementation Tasks

**3.1 Database Schema** (2 hours)
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('todo', 'in_progress', 'done')),
  assigned_to UUID REFERENCES profiles(id),
  permit_id UUID REFERENCES permits(id),
  due_date DATE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
CREATE POLICY "Users can manage company tasks"
  ON tasks FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );
```

**3.2 API + Hook** (2 hours)
```typescript
// src/hooks/useTasks.ts
export function useTasks(companyId: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  
  const createTask = async (task: Partial<Task>) => {
    const { data, error } = await supabase
      .from('tasks')
      .insert({ ...task, company_id: companyId })
      .select()
      .single();
    if (error) throw error;
    setTasks(prev => [...prev, data]);
  };
  
  const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
    await supabase.from('tasks').update({ status }).eq('id', taskId);
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
  };
  
  // ... CRUD methods
  
  return { tasks, createTask, updateTaskStatus, ... };
}
```

**3.3 Kanban Board UI** (8 hours)
```typescript
// src/features/tasks/TaskBoardView.tsx
- Three columns: To Do / In Progress / Done
- Each column: List of task cards
- Task card:
  - Title + description preview
  - Assignee avatar (if any)
  - Linked permit (chip)
  - Due date badge
  - Quick status buttons
- Create task button → modal
- Optional: react-beautiful-dnd for drag & drop

// src/features/tasks/CreateTaskModal.tsx
- Form: title, description, assignee, permit, due date
- Assignee: dropdown of company users
- Permit: searchable select
```

**3.4 Integration** (1 hour)
- Replace old TaskBoardView
- Test CRUD operations

**3.5 Testing** (1 hour)
- Create/update/delete tasks
- Status changes work
- Assignments display correctly

**Success Criteria:**
- ✅ Kanban view functional
- ✅ Tasks can be assigned
- ✅ 20%+ teams use tasks weekly

---

### Milestone 4: Permisos v2 - UX Improvements (Week 4)
**RICE Score**: 10.0 | **Priority**: P1 | **Duration**: 1.0 week

#### Current State
- Files: `PermitListView.tsx`, `PermitDetailView.tsx`
- Status: Basic CRUD functional
- Issues: No sorting/filtering, no bulk actions, no PDF preview

#### Target State
- Sortable/filterable table
- Bulk actions (delete, update status)
- In-app PDF preview
- Upload progress indicator

#### Implementation Tasks

**4.1 Table Component** (4 hours)
```typescript
// src/features/permits/PermitsTable.tsx
- Use @tanstack/react-table
- Columns: Type, Location, Status, Expiry, Actions
- Sortable by: expiry date, status, type
- Filters: status dropdown, location dropdown, date range picker
- Row selection checkboxes
- Bulk actions bar (appears when rows selected)

import { useReactTable, getCoreRowModel } from '@tanstack/react-table';

const table = useReactTable({
  data: permits,
  columns,
  getCoreRowModel: getCoreRowModel(),
  enableRowSelection: true,
});
```

**4.2 Bulk Actions** (3 hours)
```typescript
// Bulk delete
const handleBulkDelete = async () => {
  const selected = table.getSelectedRowModel().rows.map(r => r.original.id);
  await Promise.all(selected.map(id => deletePermit(id)));
  toast.success(`${selected.length} permisos eliminados`);
};

// Bulk status update
const handleBulkStatusUpdate = async (newStatus: PermitStatus) => {
  const selected = table.getSelectedRowModel().rows.map(r => r.original.id);
  await Promise.all(selected.map(id => updatePermit(id, { status: newStatus })));
  toast.success(`${selected.length} permisos actualizados`);
};
```

**4.3 PDF Preview** (4 hours)
```typescript
// src/features/permits/DocumentPreview.tsx
// Use react-pdf or iframe
import { Document, Page } from 'react-pdf';

<Dialog>
  <DialogContent className="max-w-4xl">
    <Document file={documentUrl}>
      <Page pageNumber={1} />
    </Document>
  </DialogContent>
</Dialog>
```

**4.4 Upload Progress** (2 hours)
```typescript
// Show upload progress bar
const [uploadProgress, setUploadProgress] = useState(0);

// In uploadPermitDocument, track progress
const { data, error } = await supabase.storage
  .from('permit-documents')
  .upload(filePath, file, {
    onUploadProgress: (progress) => {
      setUploadProgress((progress.loaded / progress.total) * 100);
    },
  });
```

**4.5 Integration & Testing** (3 hours)
- Replace old PermitListView
- Test all new features
- Mobile responsive

**Success Criteria:**
- ✅ Table sortable/filterable
- ✅ Bulk actions functional
- ✅ PDF preview works
- ✅ < 5% error rate on permit creation

---

### Milestone 5: Documents Vault Improvements (Week 5)
**RICE Score**: 7.5 | **Priority**: P1 | **Duration**: 1.0 week

#### Current State
- File: `src/features/documents/DocumentVaultView.tsx`
- Status: Single file upload
- Issues: Slow for 10+ documents, flat structure

#### Target State
- Bulk upload (drag & drop multiple files)
- Folder structure by location
- ZIP export
- Upload queue with retry

#### Implementation Tasks

**5.1 Bulk Upload UI** (6 hours)
```typescript
// src/features/documents/BulkUploadZone.tsx
- Large drag & drop area
- Accept multiple files
- Show upload queue (file name, size, progress %)
- Retry failed uploads

const handleMultipleFiles = async (files: File[]) => {
  const queue = files.map(file => ({
    file,
    status: 'pending',
    progress: 0,
  }));
  
  setUploadQueue(queue);
  
  for (const item of queue) {
    try {
      await uploadPermitDocument(permitId, item.file);
      updateQueueItem(item.file.name, 'completed', 100);
    } catch (error) {
      updateQueueItem(item.file.name, 'failed', 0);
    }
  }
};
```

**5.2 Folder Structure** (4 hours)
```typescript
// Group documents by location
const documentsByLocation = useMemo(() => {
  const grouped: Record<string, Document[]> = {};
  
  documents.forEach(doc => {
    const permit = permits.find(p => p.id === doc.permit_id);
    if (!permit) return;
    
    const locationId = permit.location_id;
    if (!grouped[locationId]) grouped[locationId] = [];
    grouped[locationId].push(doc);
  });
  
  return grouped;
}, [documents, permits]);

// Render as expandable tree
locations.map(location => (
  <Collapsible key={location.id}>
    <CollapsibleTrigger>
      <Folder /> {location.name} ({documentsByLocation[location.id]?.length || 0})
    </CollapsibleTrigger>
    <CollapsibleContent>
      {documentsByLocation[location.id]?.map(doc => (
        <DocumentRow key={doc.id} document={doc} />
      ))}
    </CollapsibleContent>
  </Collapsible>
))
```

**5.3 ZIP Export** (3 hours)
```typescript
// src/lib/exportDocuments.ts
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export async function exportDocumentsAsZip(documents: Document[]) {
  const zip = new JSZip();
  
  for (const doc of documents) {
    const url = await getDocumentUrl(doc.file_path);
    const response = await fetch(url);
    const blob = await response.blob();
    zip.file(doc.file_name, blob);
  }
  
  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, `documents-${Date.now()}.zip`);
}
```

**5.4 Testing** (3 hours)
- Upload 10+ files
- Verify < 30s total time
- ZIP export works
- Folder navigation smooth

**Success Criteria:**
- ✅ Bulk upload works (10+ files)
- ✅ < 30s to upload 10 documents
- ✅ ZIP export functional

---

### Milestone 6: Network Map Performance Fix (Week 5-6)
**RICE Score**: 5.0 | **Priority**: P2 | **Duration**: 1.0 week

#### Current Issues
- V3 implemented but tests failing
- Performance degrades with 50+ nodes
- Filters incomplete

#### Implementation Tasks

**6.1 Fix Tests** (2 hours)
- Add Supabase env vars to test config
- Mock Supabase client in tests
- Fix useStaticLayout test assertions

**6.2 Performance Optimization** (4 hours)
```typescript
// Memoize expensive calculations
const nodes = useMemo(() => generateNodes(data), [data]);
const edges = useMemo(() => generateEdges(data), [data]);

// Virtualize if 100+ nodes
import { useVirtual } from '@tanstack/react-virtual';

// Debounce filter changes
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
```

**6.3 Improved Filters** (3 hours)
- Filter by permit type (dropdown)
- Filter by status (vigente/vencido)
- Filter by location (searchable select)
- "Show only" checkboxes (sedes, permits, both)

**6.4 Export PNG** (3 hours)
```typescript
import html2canvas from 'html2canvas';

const exportAsPNG = async () => {
  const element = document.getElementById('network-map');
  const canvas = await html2canvas(element!);
  canvas.toBlob(blob => {
    saveAs(blob!, 'network-map.png');
  });
};
```

**6.5 Testing** (4 hours)
- Test with 100+ nodes
- Verify < 2s render time
- Export works
- Filters functional

**Success Criteria:**
- ✅ Tests passing
- ✅ 100 nodes render in < 2s
- ✅ PNG export works

---

### Milestone 7: Technical Debt Cleanup (Week 6)
**RICE Score**: N/A | **Priority**: P2 | **Duration**: 1.0 week

#### Cleanup Tasks

**7.1 Consolidate Design Tokens** (2 hours)
- Merge `src/index.css` + `src/styles/design-tokens.css`
- Remove duplication
- Verify all colors/spacing still work

**7.2 Remove Console Logs** (1 hour)
- 71 console.log/warn/info statements
- Keep only console.error
- Add ESLint rule to prevent future logs

**7.3 Fix Circular Dependencies** (3 hours)
- `useLocations` ↔ `usePermits` circular import
- Extract shared types to `@/types/hooks.ts`
- Memoize risk calculation

**7.4 Component Extraction** (4 hours)
- Move shared components from features/ to components/
- Extract badge variants to separate file
- Extract button variants to separate file

**7.5 Delete Legacy Code** (2 hours)
- Once all features migrated, delete old UI v1 files
- Clean up unused imports
- Run `npm run lint --fix`

**7.6 Update Documentation** (4 hours)
- Update README with Phase 2 status
- Update CHANGELOG
- Update UI-V2-INVENTORY.md
- Create Phase 3 backlog

**Success Criteria:**
- ✅ Build time < 1.5s (maintain speed)
- ✅ Zero console logs in production
- ✅ No circular dependencies
- ✅ Code review score: 8/10+

---

## Testing Strategy

### Unit Tests
- Each new feature module has at least 1 test file
- Key business logic covered (risk calculation, date utils, renewals logic)
- Target: 80%+ coverage on new code

### Integration Tests
- Test API calls with mock Supabase responses
- Test hooks with React Testing Library
- Test forms with React Hook Form

### E2E Tests (Optional)
- Happy path: Create location → Upload permit → Renew permit
- Edge cases: Bulk delete, batch renewal

### Manual Testing Checklist
- [ ] All features accessible from sidebar
- [ ] Mobile responsive (test on iPhone 13 Pro, Pixel 7)
- [ ] Demo mode works without auth
- [ ] Production mode requires auth
- [ ] No console errors in browser
- [ ] Lighthouse score > 90

---

## Deployment Plan

### Pre-Deploy Checklist
- [ ] All tests passing
- [ ] Build succeeds
- [ ] ESLint clean (or warnings only, no errors)
- [ ] Database migrations applied
- [ ] Environment variables set
- [ ] Demo data seeded

### Deployment Steps
1. **Database migrations** (apply in order)
   ```bash
   npx supabase db push
   ```

2. **Seed legal references**
   ```bash
   npm run seed:legal
   ```

3. **Build and deploy**
   ```bash
   npm run build
   git push origin main  # Auto-deploy via Vercel
   ```

4. **Smoke test production**
   - [ ] Login works
   - [ ] Dashboard loads
   - [ ] Create location
   - [ ] Upload permit
   - [ ] Access new features (Legal, Renewals, Tasks)

---

## Risk Mitigation

### Risk 1: Feature Scope Creep
**Mitigation**: 
- Stick to MVP for each feature
- No "nice-to-haves" until Phase 3
- Timebox each milestone

### Risk 2: Database Migration Issues
**Mitigation**:
- Test migrations on staging first
- Have rollback plan
- Backup production DB before migrations

### Risk 3: Performance Regression
**Mitigation**:
- Monitor build time after each change
- Use React Profiler to check re-renders
- Keep bundle size < 500KB

### Risk 4: Breaking Changes
**Mitigation**:
- Feature flags for new features
- A/B test with small user group
- Keep old routes until v2 stable

---

## Success Metrics

### Code Quality
- ✅ Build time: < 1.5s
- ✅ Test coverage: 80%+
- ✅ ESLint clean
- ✅ Zero TypeScript errors
- ✅ Code review score: 8/10+

### Feature Adoption (Track in Phase 3)
- Legal v2: 30%+ users access monthly
- Renewals v2: 50%+ permits renewed on-time
- Tasks v2: 20%+ teams use weekly
- Permits v2: < 5% error rate on creation
- Documents Vault: < 30s to upload 10 files

### Business Metrics
- Onboarding completion: 80%+
- Weekly Active Users: 60%+
- Zero critical bugs in production

---

## Timeline Summary

| Week | Milestone | Status |
|------|-----------|--------|
| 1 | Legal v2 (Part 1) | Not Started |
| 2 | Legal v2 (Part 2) + Renovaciones v2 (Start) | Not Started |
| 3 | Renovaciones v2 (Finish) + Tareas v2 | Not Started |
| 4 | Permisos v2 UX | Not Started |
| 5 | Documents Vault + Network Map (Start) | Not Started |
| 6 | Network Map (Finish) + Technical Debt | Not Started |

**Total Duration**: 6 weeks  
**Target Completion**: 2026-06-15

---

## Next Steps After Completion

### Phase 3 Prep
1. Design email notification system
2. Plan RBAC implementation
3. Design custom reports feature
4. Research PDF generation libraries

### Phase 3 Kickoff
- Start: 2026-06-16
- Duration: 8-10 weeks
- Goal: Growth features (alerts, reports, RBAC, team management)

---

## Approval & Sign-off

**Plan Author**: Claude Sonnet 4.5  
**Date**: 2026-05-04  
**Status**: ✅ Ready for Execution

**Next Action**: Begin Milestone 1 (Legal v2) implementation.
