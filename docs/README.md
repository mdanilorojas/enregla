# EnRegla Documentation

Welcome to the EnRegla documentation. This directory contains all product, technical, and project documentation.

---

## 📁 Documentation Structure

```
docs/
├── README.md                    # This file - Documentation index
├── product/                     # Product strategy & planning
│   ├── PRODUCT.md              # Product vision, features, metrics
│   ├── ROADMAP.md              # Release roadmap (Phases 1-4)
│   └── BACKLOG.md              # Prioritized user stories (RICE)
│
├── architecture/                # Technical architecture & design
│   └── .impeccable.md          # Design principles & brand identity
│
├── project/                     # Project management & status
│   ├── status-2026-04-14.md    # Project status snapshots
│   ├── CODE-REVIEW-FINDINGS.md # Audit results & recommendations
│   ├── UI-V2-INVENTORY.md      # Feature migration status
│   ├── UI-V2-MERGE-PLAN.md     # Merge strategy & checklists
│   └── PR-DESCRIPTION.md       # Pull request templates
│
├── guides/                      # How-to guides (empty - to be filled)
│   ├── user/                   # End-user guides
│   └── developer/              # Developer guides
│
├── superpowers/                 # Feature specs & implementations
│   ├── specs/                  # Feature design documents
│   ├── plans/                  # Implementation plans
│   └── testing/                # Test reports & checklists
│
└── legacy/                      # Archived documentation
    ├── SUPABASE_SETUP.md       # Original Supabase guide
    ├── DESIGN_SYSTEM.md        # Original design system docs
    └── deep-research-report.md # Historical research
```

---

## 📚 Quick Links

### Product Documentation
- **[Product Overview](./product/PRODUCT.md)** - Complete product vision, strategy, features, and metrics
- **[Roadmap](./product/ROADMAP.md)** - Release timeline and planned features (Q2-Q4 2026)
- **[Backlog](./product/BACKLOG.md)** - Prioritized user stories with RICE scoring

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
