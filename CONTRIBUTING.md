# Contributing to EnRegla

Thank you for your interest in contributing to EnRegla! This guide will help you get started.

---

## 🎯 Getting Started

### Prerequisites
- Node.js 18+ (LTS recommended)
- npm 9+
- Git
- Supabase account (for backend testing)

### Setup Development Environment

1. **Fork & Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/enregla.git
   cd enregla
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

4. **Start Dev Server**
   ```bash
   npm run dev
   ```

---

## 🔀 Development Workflow

### 1. Create a Feature Branch

```bash
# Always branch from main
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

### Branch Naming Convention

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feature/description` | `feature/email-alerts` |
| Bug Fix | `fix/description` | `fix/badge-prop-mismatch` |
| Docs | `docs/description` | `docs/api-reference` |
| Refactor | `refactor/description` | `refactor/risk-calculation` |
| Test | `test/description` | `test/location-crud` |

---

### 2. Make Changes

**Code Standards:**
- ✅ TypeScript strict mode enabled
- ✅ ESLint rules enforced
- ✅ Functional components with hooks (no class components)
- ✅ Proper prop types & interfaces
- ✅ JSDoc comments for complex logic

**Style Guide:**
```typescript
// ✅ Good
export function LocationCard({ location, permits }: LocationCardProps) {
  const locationCode = getLocationCode(location.id);
  
  return (
    <Card onClick={() => navigate(`/sedes/${location.id}`)}>
      {/* Component JSX */}
    </Card>
  );
}

// ❌ Bad
export function LocationCard(props: any) {
  return <div>{props.location.name}</div>;
}
```

---

### 3. Commit Your Changes

We follow [Conventional Commits](https://www.conventionalcommits.org/).

#### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Types

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat(locations): add risk scoring calculation` |
| `fix` | Bug fix | `fix(auth): resolve mock profile hardcoded company_id` |
| `docs` | Documentation only | `docs(readme): update installation instructions` |
| `refactor` | Code refactoring | `refactor(hooks): memoize risk calculation` |
| `test` | Add/update tests | `test(permits): add upload validation tests` |
| `chore` | Maintenance tasks | `chore: update dependencies` |
| `style` | Formatting, no code change | `style(badge): fix spacing` |
| `perf` | Performance improvement | `perf(map): optimize node rendering` |

#### Scope (Optional)

Component or feature area: `auth`, `dashboard`, `locations`, `permits`, etc.

#### Examples

```bash
# Simple fix
git commit -m "fix: resolve Badge color prop to variant"

# Feature with body
git commit -m "feat(renewals): add timeline view

- Implemented 30/60/90 day columns
- Added status badges (urgent/upcoming/ok)
- Integrated batch renewal action

Closes #42"

# Breaking change
git commit -m "refactor(api)!: change permit API response format

BREAKING CHANGE: permits endpoint now returns nested location object"
```

---

### 4. Run Tests & Linting

Before pushing, ensure all checks pass:

```bash
# Run linter
npm run lint

# Run tests
npm run test

# Build check
npm run build
```

**Fix issues:**
```bash
# Auto-fix linting issues
npm run lint -- --fix
```

---

### 5. Push & Create Pull Request

```bash
# Push branch
git push origin feature/your-feature-name

# Create PR (via GitHub UI or CLI)
gh pr create --title "feat: add feature description" --body "Description..."
```

---

## 📝 Pull Request Guidelines

### PR Title

Use the same format as commit messages:
```
feat(locations): add automatic risk scoring
fix(auth): resolve Google OAuth validation
```

### PR Description Template

```markdown
## Summary
Brief description of what this PR does.

## Changes
- Added X feature
- Fixed Y bug
- Refactored Z component

## Testing
- [ ] Manual testing performed
- [ ] Unit tests added/updated
- [ ] Build passes
- [ ] No console errors

## Screenshots (if UI changes)
[Add screenshots here]

## Related Issues
Closes #123
```

### PR Checklist

Before submitting:
- [ ] Code follows project style guide
- [ ] All tests pass (`npm run test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] No console.log or debugging code
- [ ] Documentation updated (if needed)
- [ ] Commit messages follow Conventional Commits

---

## 🧪 Testing Guidelines

### Writing Tests

Use Vitest + React Testing Library:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LocationCard } from './LocationCard';

describe('LocationCard', () => {
  it('renders location name', () => {
    render(<LocationCard location={mockLocation} permits={[]} />);
    expect(screen.getByText('Sede Central')).toBeInTheDocument();
  });

  it('calculates risk level correctly', () => {
    render(<LocationCard location={highRiskLocation} permits={expiredPermits} />);
    expect(screen.getByText('Crítica')).toBeInTheDocument();
  });
});
```

### Test Coverage

Aim for:
- **80%+ coverage** for new features
- **100% coverage** for critical paths (auth, payment, data loss)

Run with coverage:
```bash
npm run test -- --coverage
```

---

## 🎨 Design System

### Using UI v2 Components

All new features must use `components/ui-v2/`:

```typescript
// ✅ Correct
import { Button, Card, Badge } from '@/components/ui-v2';

// ❌ Wrong
import { Button } from '@/components/ui'; // Old components
```

### Badge Variants

Use semantic variants:

```typescript
// Risk badges
<Badge variant="risk-critico">Crítica</Badge>
<Badge variant="risk-alto">Alta</Badge>
<Badge variant="risk-medio">Media</Badge>
<Badge variant="risk-bajo">Baja</Badge>

// Status badges
<Badge variant="success">Vigente</Badge>
<Badge variant="warning">Por Vencer</Badge>
<Badge variant="destructive">Vencido</Badge>
```

### Design Tokens

Use CSS variables from `design-tokens.css`:

```css
/* ✅ Good */
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
}

/* ❌ Bad */
.card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  color: #111827;
}
```

See [Design Context](./docs/architecture/.impeccable.md) for full guidelines.

---

## 📚 Documentation

### When to Update Docs

Update documentation when:
- Adding new features → Update `docs/product/PRODUCT.md`
- Changing API contracts → Update technical specs
- Adding environment variables → Update `.env.example` + README
- Changing architecture → Update `docs/architecture/`

### Documentation Structure

```
docs/
├── product/          # Product vision, roadmap, backlog
├── architecture/     # Design decisions, technical context
├── guides/           # How-to guides for users/developers
├── superpowers/      # Feature specs & implementation plans
└── legacy/           # Archived documentation
```

---

## 🐛 Reporting Bugs

### Bug Report Template

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- Browser: [e.g. Chrome 120]
- OS: [e.g. macOS 14]
- Version: [e.g. 1.0.0]

**Additional context**
Any other context about the problem.
```

---

## 💡 Feature Requests

### Feature Request Template

```markdown
**Feature Summary**
One-paragraph description.

**User Story**
As a [persona], I want [feature], so that [goal].

**Acceptance Criteria**
- [ ] Criteria 1
- [ ] Criteria 2

**Priority**
P0 / P1 / P2 / P3

**RICE Score** (optional)
- Reach: X
- Impact: Y
- Confidence: Z
- Effort: W weeks
```

See [BACKLOG.md](./docs/product/BACKLOG.md) for prioritization framework.

---

## 🚀 Release Process

### Versioning

We use [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes (e.g., 1.0.0 → 2.0.0)
- **MINOR**: New features (e.g., 1.0.0 → 1.1.0)
- **PATCH**: Bug fixes (e.g., 1.0.0 → 1.0.1)

### Release Checklist

- [ ] All tests pass
- [ ] Build succeeds
- [ ] Changelog updated
- [ ] Version bumped in `package.json`
- [ ] Tag created: `git tag v1.0.0`
- [ ] Deployed to production
- [ ] Release notes published

---

## 📞 Getting Help

- **Questions**: Open a [GitHub Discussion](https://github.com/mdanilorojas/enregla/discussions)
- **Bugs**: Open a [GitHub Issue](https://github.com/mdanilorojas/enregla/issues)
- **Chat**: (TBD - Discord/Slack link)

---

## 🎉 Recognition

Contributors will be recognized in:
- `CONTRIBUTORS.md` (to be created)
- Release notes
- Git commit history

Thank you for contributing! 🙌

---

**Last Updated**: 2026-04-20
