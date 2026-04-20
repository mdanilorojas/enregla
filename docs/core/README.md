# 🏆 Core Documentation - ORO PURO

**Esta carpeta contiene ÚNICAMENTE documentación esencial del proyecto. No tocar nada que no sea oro.**

---

## 📚 Documentos en esta carpeta

### 1. **PRODUCT.md** - La Biblia del Producto
**Qué es**: Documento maestro completo del producto  
**Cuándo leer**: Antes de cualquier decisión de producto  
**Contiene**:
- One-page description (qué es EnRegla)
- Product vision 3-5 años
- North Star Metric (% permisos vigentes)
- Feature inventory completo
- Success metrics & KPIs
- Business model & unit economics
- Design principles

**Audiencia**: Product Owner, CEO, Inversores, todo el equipo

---

### 2. **ROADMAP.md** - El Plan de Releases
**Qué es**: Timeline ejecutivo Q2-Q4 2026  
**Cuándo leer**: Planning de sprints, decisiones de priorización  
**Contiene**:
- Phase 1: MVP (SHIPPED ✅)
- Phase 2: Feature Parity (6 weeks)
- Phase 3: Growth Features (10 weeks)
- Phase 4: Platform Expansion (12 weeks)
- Success criteria por fase
- Known blockers & risks

**Audiencia**: Engineering, Product, Stakeholders

---

### 3. **BACKLOG.md** - User Stories Priorizadas
**Qué es**: Backlog con RICE scoring  
**Cuándo leer**: Sprint planning, feature prioritization  
**Contiene**:
- 17 user stories con RICE scores
- P0: Critical (Legal v2, Renovaciones v2, Tareas v2)
- P1: High (Permisos v2, Alerts, Documents)
- P2: Medium (Reports, Audit trail, Network fixes)
- P3: Low (Team mgmt, Calendar, AI)
- Acceptance criteria por story

**Audiencia**: Engineering, Product Owner, Scrum Master

---

### 4. **CODE-REVIEW-FINDINGS.md** - Audit Técnico
**Qué es**: Code review completo del merge UI v2  
**Cuándo leer**: Antes de PR grandes, decisiones técnicas  
**Contiene**:
- Score: 6/10 → Production-ready
- 3 blockers críticos (RESUELTOS ✅)
- Recomendaciones de arquitectura
- Deuda técnica priorizada
- Checklist de calidad

**Audiencia**: Engineering Lead, Code Reviewers

---

### 5. **PM-DOCUMENTATION-AUDIT.md** - Audit de PM
**Qué es**: Verificación de docs contra PM best practices  
**Cuándo leer**: Validar que documentación esté completa  
**Contiene**:
- Score: 8.5/10 - Excellent
- Audit contra 10 frameworks PM
- Gaps identificados (OKRs, GTM, Lean Canvas)
- Action items priorizados
- Veredicto: Production-ready ✅

**Audiencia**: Product Owner, CEO, PM Team

---

### 6. **DESIGN-CONTEXT.md** - Principios de Diseño
**Qué es**: Brand identity, aesthetic direction, anti-patterns  
**Cuándo leer**: Antes de diseñar features nuevas  
**Contiene**:
- Brand personality: "Preciso, Confiable, Protector"
- Audiencia: Gerentes, consultores, dueños PYME
- Aesthetic: Corporativo moderno, light mode
- Typography: Manrope (no Inter)
- Design principles (5 pilares)
- Anti-patterns eliminados (AI slop)

**Audiencia**: Design, Frontend Engineering

---

## 🚫 Lo que NO va en esta carpeta

- ❌ Documentos de proceso (cleanup plans, reorganization)
- ❌ Status reports temporales (status-2026-04-14.md)
- ❌ PRs descriptions (PR-DESCRIPTION.md)
- ❌ Implementation plans detallados (van en superpowers/)
- ❌ Documentación legacy/archivada
- ❌ Borradores o work-in-progress

**Regla de oro**: Si no es **oro puro** que alguien necesita leer para entender el producto/proyecto → NO VA AQUÍ.

---

## 📖 Cómo usar esta carpeta

### Nuevo en el equipo?
Lee en este orden:
1. **PRODUCT.md** (30 min) - Entender qué es EnRegla
2. **DESIGN-CONTEXT.md** (10 min) - Entender la estética
3. **ROADMAP.md** (15 min) - Entender hacia dónde vamos
4. **BACKLOG.md** (browse) - Ver qué features vienen

### Planning un sprint?
1. **ROADMAP.md** - Qué fase estamos?
2. **BACKLOG.md** - Qué stories son P0/P1?
3. **CODE-REVIEW-FINDINGS.md** - Qué deuda técnica hay?

### Haciendo code review?
1. **CODE-REVIEW-FINDINGS.md** - Standards de calidad
2. **DESIGN-CONTEXT.md** - Anti-patterns a evitar

### Tomando decisiones de producto?
1. **PRODUCT.md** - Alineado con vision/strategy?
2. **PM-DOCUMENTATION-AUDIT.md** - Gaps que resolver?

---

## 🔄 Mantenimiento

**Frecuencia de actualización**:
- **PRODUCT.md**: Trimestral (o cuando cambia strategy)
- **ROADMAP.md**: Mensual (ajustes de timeline)
- **BACKLOG.md**: Semanal (grooming)
- **CODE-REVIEW-FINDINGS.md**: Por release/merge
- **PM-DOCUMENTATION-AUDIT.md**: Trimestral
- **DESIGN-CONTEXT.md**: Rara vez (solo si cambia brand)

**Quién actualiza**:
- Product Owner: PRODUCT.md, ROADMAP.md, BACKLOG.md
- Engineering Lead: CODE-REVIEW-FINDINGS.md
- Product Owner: PM-DOCUMENTATION-AUDIT.md
- Design Lead: DESIGN-CONTEXT.md

---

## 🎯 Reglas de esta carpeta

1. **Solo oro puro** - Si dudas, no va aquí
2. **Siempre actualizado** - Docs desactualizados son peor que no tener docs
3. **Un solo owner** - Cada doc tiene un responsable claro
4. **Archivos estables** - No renombrar/mover sin avisar al equipo
5. **Links externos** - Si necesitas referenciar otros docs, linkea, no copies

---

## 📞 Preguntas?

- **Doc desactualizado?** → Notifica al owner
- **Falta algo?** → Propón agregarlo (pero debe ser ORO)
- **No entiendes algo?** → Pregunta en equipo, mejora el doc

---

**Última revisión**: 2026-04-20  
**Mantenida por**: Product & Engineering Leads

---

**🏆 Esta es la fuente de verdad del proyecto. Protégela.**
