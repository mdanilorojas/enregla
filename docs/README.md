# EnRegla Documentation

Welcome to the EnRegla documentation. This directory contains all product, technical, and project documentation.

---

## 🏆 **START HERE: [Core Documentation](./core/README.md)**

**La carpeta `core/` contiene ÚNICAMENTE documentación esencial (oro puro):**
- **PRODUCT.md** - La biblia del producto
- **ROADMAP.md** - Plan de releases Q2-Q4 2026
- **BACKLOG.md** - User stories priorizadas (RICE)
- **CODE-REVIEW-FINDINGS.md** - Audit técnico
- **PM-DOCUMENTATION-AUDIT.md** - Audit de PM (8.5/10)
- **DESIGN-CONTEXT.md** - Principios de diseño & brand

**👉 Si eres nuevo, empieza por [docs/core/](./core/README.md)**

---

## 📁 Documentation Structure

```
docs/
├── README.md                    # This file - Documentation index
│
├── core/ 🏆                     # ORO PURO - Essential docs only
│   ├── README.md               # Guide to core documentation
│   ├── PRODUCT.md              # Product vision, features, metrics
│   ├── ROADMAP.md              # Release roadmap (Phases 1-4)
│   ├── BACKLOG.md              # Prioritized user stories (RICE)
│   ├── CODE-REVIEW-FINDINGS.md # Technical audit
│   ├── PM-DOCUMENTATION-AUDIT.md # PM frameworks audit
│   └── DESIGN-CONTEXT.md       # Design principles & brand
│
├── product/                     # Product strategy (source files)
│   ├── PRODUCT.md
│   ├── ROADMAP.md
│   └── BACKLOG.md
│
├── architecture/                # Technical architecture
│   └── .impeccable.md
│
├── project/                     # Project management & WIP
│   ├── CODE-REVIEW-FINDINGS.md
│   ├── PM-DOCUMENTATION-AUDIT.md
│   ├── UI-V2-INVENTORY.md
│   ├── status-*.md
│   └── (cleanup plans, reorganization docs)
│
├── guides/                      # How-to guides (future)
│   ├── user/
│   └── developer/
│
├── superpowers/                 # Feature specs & plans
│   ├── specs/
│   ├── plans/
│   └── testing/
│
└── legacy/                      # Archived documentation
    └── (old design docs, research)
```

---

## 📚 Quick Links

### 🏆 Core Documentation (START HERE)
- **[Core Docs Index](./core/README.md)** - Essential documentation guide
- **[Product Overview](./core/PRODUCT.md)** - Complete product vision, strategy, features
- **[Roadmap](./core/ROADMAP.md)** - Release timeline Q2-Q4 2026
- **[Backlog](./core/BACKLOG.md)** - Prioritized user stories (RICE)
- **[Code Review](./core/CODE-REVIEW-FINDINGS.md)** - Technical audit (6/10 → Production-ready)
- **[PM Audit](./core/PM-DOCUMENTATION-AUDIT.md)** - Documentation audit (8.5/10)
- **[Design Context](./core/DESIGN-CONTEXT.md)** - Brand identity & design principles

### Technical Documentation
- **[Design Context](./architecture/.impeccable.md)** - Design principles, brand identity, aesthetic direction
- **[Code Review](./project/CODE-REVIEW-FINDINGS.md)** - Audit findings and technical recommendations

### Project Management
- **[UI v2 Inventory](./project/UI-V2-INVENTORY.md)** - Feature migration status (v1 → v2)
- **[Merge Plan](./project/UI-V2-MERGE-PLAN.md)** - UI v2 merge strategy and checklist
- **[Project Status](./project/status-2026-04-14.md)** - Current state and next steps

### Feature Specifications
Browse `superpowers/specs/` for detailed feature designs and `superpowers/plans/` for implementation plans.

---

## 🎯 Documentation Guidelines

### When to Create Documentation

| Document Type | When to Create | Owner |
|---------------|----------------|-------|
| **Product Docs** | New features, strategy changes | Product Owner |
| **Technical Specs** | Before implementation | Engineering |
| **Architecture Docs** | Major architectural decisions | Engineering Lead |
| **User Guides** | After feature ships | Product + Support |
| **API Docs** | When API endpoints added | Engineering |

### Documentation Standards

1. **Markdown Format**: All docs in GitHub-flavored markdown (`.md`)
2. **Front Matter**: Include date, author, status at top of doc
3. **Update Regularly**: Mark docs as `[DRAFT]`, `[CURRENT]`, or `[ARCHIVED]`
4. **Link Generously**: Cross-reference related docs
5. **Keep It DRY**: Single source of truth, no duplication

### Template Structure

```markdown
# Title

**Status**: [DRAFT | CURRENT | ARCHIVED]  
**Last Updated**: YYYY-MM-DD  
**Owner**: Name / Role

## Summary
One-paragraph overview.

## [Sections...]

## Related Documents
- [Link 1](path/to/doc1.md)
- [Link 2](path/to/doc2.md)
```

---

## 📝 Contributing to Docs

### How to Add New Documentation

1. **Choose the right folder**:
   - Product strategy → `product/`
   - Technical decisions → `architecture/`
   - Feature specs → `superpowers/specs/`
   - Implementation plans → `superpowers/plans/`
   - User guides → `guides/user/`
   - Developer guides → `guides/developer/`

2. **Use descriptive filenames**:
   ```
   # ✅ Good
   2026-04-20-email-alerts-design.md
   user-onboarding-guide.md
   
   # ❌ Bad
   doc1.md
   new-feature.md
   ```

3. **Update this README**: Add link in appropriate section

4. **Follow naming conventions**:
   - Feature specs: `YYYY-MM-DD-feature-name-design.md`
   - Implementation plans: `YYYY-MM-DD-feature-name-implementation.md`
   - Guides: `topic-name-guide.md`
   - Status: `status-YYYY-MM-DD.md`

### How to Update Existing Docs

1. Update the "Last Updated" date
2. Add changelog entry at bottom (for major docs)
3. If archiving, move to `legacy/` and update links

### Documentation Review Process

1. Create draft → Get feedback → Finalize
2. For product docs: Review with Product Owner
3. For technical docs: Review with Engineering Lead
4. Update this index when adding major docs

---

## 🔍 Searching Documentation

### By Topic

| Topic | Key Documents |
|-------|---------------|
| **Product Vision** | `product/PRODUCT.md` |
| **Features** | `product/BACKLOG.md`, `superpowers/specs/` |
| **Design System** | `architecture/.impeccable.md` |
| **Implementation** | `superpowers/plans/` |
| **Testing** | `superpowers/testing/` |
| **Deployment** | `legacy/SUPABASE_SETUP.md`, root `README.md` |

### By Audience

| Audience | Recommended Docs |
|----------|------------------|
| **Product Managers** | `product/*` |
| **Engineers** | `architecture/*`, `superpowers/*` |
| **Designers** | `architecture/.impeccable.md` |
| **QA/Testers** | `superpowers/testing/*` |
| **End Users** | `guides/user/*` (to be created) |

---

## 📊 Documentation Health

### Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Product docs up-to-date | ✅ Yes | Always |
| Feature specs written before impl | 90% | 100% |
| User guides exist | ❌ No | Yes (Phase 2) |
| API docs exist | ❌ No | Yes (Phase 4) |

### Maintenance Schedule

- **Weekly**: Update project status docs
- **Monthly**: Review & update roadmap
- **Quarterly**: Archive outdated docs, update product vision
- **Per Release**: Update CHANGELOG, feature status

---

## 🗂️ Document Status Legend

| Status | Meaning |
|--------|---------|
| `[CURRENT]` | Active, up-to-date document |
| `[DRAFT]` | Work in progress, not finalized |
| `[ARCHIVED]` | Historical record, no longer current |
| `[DEPRECATED]` | Will be removed soon |

---

## 📞 Questions?

- **Documentation issues**: Open a GitHub issue
- **Missing docs**: Request in team chat or create a stub
- **Unclear docs**: Submit PR with improvements

---

**Last Updated**: 2026-04-20  
**Maintained by**: Product & Engineering Team
