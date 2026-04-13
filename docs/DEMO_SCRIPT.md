# PermitOps V1 - Demo Script (5 minutos)

**Demo para:** Supermaxi Ecuador  
**Objetivo:** Control + Trazabilidad + Transparencia en permisos regulatorios  
**Reemplaza:** Carpetas físicas, Excel disperso, seguimiento manual

---

## Pre-Demo Setup

**Antes de empezar:**
- [ ] Base de datos seeded con `npm run seed`
- [ ] Dev server corriendo en `npm run dev`
- [ ] Usuario demo: `demo@supermaxi.com.ec` / contraseña: (tu contraseña)
- [ ] Browser con ventana limpia (sin tabs adicionales)
- [ ] Screen share listo

**Contexto Demo:**
- 3 sedes de Supermaxi: Mall del Sol, Plaza Mayor, La Marina
- 12 permisos totales (Bomberos, Municipio, Arcsa, MAE, Trabajo)
- Mix de permisos: vigentes, por vencer, vencidos
- 1 link público activo con vistas

---

## 1. CONTEXTO (30 segundos)

**Narración:**
> "Supermaxi tiene 3 sedes en Guayaquil. Cada sede necesita 4-5 permisos regulatorios vigentes para operar legalmente: Bomberos, Municipio, Arcsa, Ministerio del Ambiente, Ministerio de Trabajo..."

**Acciones:**
- Login con demo@supermaxi.com.ec
- Mostrar dashboard principal

**Qué señalar:**
- **Estado global:** 10/12 permisos vigentes
- **2 alertas críticas** (color rojo)
- **3 tarjetas de sedes** con diferentes niveles de riesgo
- Métrica de compliance: 83%

---

## 2. VISTA GLOBAL (1 minuto)

**Narración:**
> "El dashboard muestra el estado de todas las sedes de un vistazo. Vemos que Mall del Sol tiene un problema..."

**Acciones:**
- Señalar tarjetas con indicadores de riesgo
- Hover sobre "Mall del Sol" (alto riesgo)
- **Click en "Supermaxi Mall del Sol"**

**Qué señalar:**
- Risk indicators (Verde/Amarillo/Rojo)
- Compliance % por sede
- Próximos vencimientos
- Navegación fluida con animaciones

---

## 3. DETALLE DE SEDE (1 minuto)

**Narración:**
> "Aquí vemos los 4 permisos de esta sede específica. El permiso de Bomberos vence en 15 días..."

**Acciones:**
- Mostrar tabla de permisos
- Señalar permiso "Bomberos" con estado "Por Vencer"
- Señalar banner de link público (arriba)
  - "3 vistas, hace 2 horas"
  - Mini QR code visible

**Qué señalar:**
- **Estado de cada permiso** (vigente/por vencer/vencido)
- **Fecha de vencimiento** resaltada en amarillo
- **Link público activo** - transparencia hacia autoridades
- Botón "Renovar" disponible

---

## 4. RENOVACIÓN DE PERMISO (1.5 minutos)

**Narración:**
> "Renovemos el permiso de Bomberos antes de que venza. El sistema mantiene historial completo..."

**Acciones:**
1. **Click "Renovar"** en permiso Bomberos
2. **En el modal:**
   - Fecha emisión: [hoy]
   - Fecha vencimiento: [+1 año]
   - Número: BOM-2026-001
   - Subir documento (optional - puede saltar)
3. **Click "Renovar Permiso"**
4. **Esperar confirmación** → Modal de éxito
5. **Cerrar modal** → Regresar a sede
6. **Click en permiso renovado** → Ver detalle
7. **Scroll a "Historial de versiones"**

**Qué señalar:**
- **Versionado automático:** v1 (archivada) → v2 (actual)
- **Trazabilidad completa:** quién, cuándo, qué cambió
- **Documentos adjuntos** a cada versión
- **Sin pérdida de información** histórica

---

## 5. TRANSPARENCIA PÚBLICA (1 minuto)

**Narración:**
> "La transparencia es clave. Podemos generar un link público con QR para que autoridades verifiquen nuestros permisos sin acceso al sistema..."

**Acciones:**
1. **Scroll arriba** → Banner de link público
2. **Click "Ver QR"** → Modal con QR grande
3. **Mostrar opciones:**
   - Copiar Link
   - Descargar QR
   - Imprimir QR
4. **Click derecho "Abrir link en nueva pestaña"** (copiar URL del banner)
5. **Abrir en nueva ventana** → Vista pública SIN LOGIN
6. **Mostrar vista pública:**
   - Logo EnRegla
   - Nombre sede + dirección
   - **SOLO permisos vigentes** (no muestra vencidos)
   - Badge "✓ Permisos Vigentes Verificados"
   - Sin botones de edición
7. **Regresar a pestaña interna**
8. **Refrescar banner** → "4 vistas, hace 1 minuto"

**Qué señalar:**
- **QR code** para pegar en recepción/muro
- **Vista pública:** información verificable sin exponer sensible
- **Contador de vistas** → trazabilidad de inspecciones
- **Sin necesidad de login** para autoridades

---

## 6. CIERRE (30 segundos)

**Narración:**
> "**Control:** Vemos el estado de todos los permisos en tiempo real.  
> **Trazabilidad:** Historial completo de cada renovación, quién, cuándo, qué documento.  
> **Transparencia:** Links públicos con QR para inspectores, sin exponer información sensible.
>
> Reemplaza carpetas físicas, Excel disperso, y seguimiento manual.  
> Todo en un solo lugar, seguro, auditable, y listo para escalar a más sedes."

**Acciones:**
- Regresar al dashboard principal
- Mostrar vista general una última vez
- **Pregunta abierta:** "¿Cómo manejan hoy los permisos en las 50+ sedes de Supermaxi?"

---

## Notas de Timing

| Sección | Tiempo Objetivo | Backup (+30s) |
|---------|-----------------|---------------|
| 1. Contexto | 30s | Dashboard overview |
| 2. Global | 1min | Hover sobre más tarjetas |
| 3. Detalle Sede | 1min | Ver otro permiso |
| 4. Renovación | 1.5min | Mostrar documentos |
| 5. Transparencia | 1min | Regenerar QR |
| 6. Cierre | 30s | Q&A |
| **TOTAL** | **5min** | **6min** |

---

## Troubleshooting

**Si algo falla:**

| Problema | Solución |
|----------|----------|
| Login no funciona | Verificar seed corrió correctamente |
| No hay permisos | Re-run `npm run seed` |
| Animaciones lentas | Refrescar browser, cerrar tabs |
| Modal no abre | Check console, reload page |
| Link público 404 | Verificar RPC `get_public_permits` existe |
| QR no se ve | Verificar `qrcode.react` instalado |

**Comando de emergencia:**
```bash
# Re-seed toda la base de datos
npm run seed
```

---

## Post-Demo Q&A

**Preguntas esperadas:**

**Q: "¿Cómo se integra con nuestro ERP?"**
A: API REST disponible. Podemos sincronizar sedes, permisos, y alertas desde su sistema actual.

**Q: "¿Cuánto cuesta escalar a 50 sedes?"**
A: Pricing basado en # de sedes. Incluye usuarios ilimitados, almacenamiento, y soporte.

**Q: "¿Qué pasa si un inspector viene SIN escanear el QR?"**
A: Pueden abrir el link manualmente. El QR es solo conveniencia.

**Q: "¿Soporta otros permisos como patentes, sanitarios, etc.?"**
A: Sí. El sistema es agnóstico al tipo de permiso. Configurable por industria.

**Q: "¿Notificaciones automáticas de vencimientos?"**
A: Roadmap V2. Por ahora: dashboard + reportes programados por email.

---

## Success Metrics

**Demo exitoso si:**
- [ ] Flujo completo sin errores técnicos
- [ ] Cliente entiende el valor (Control + Trazabilidad + Transparencia)
- [ ] Preguntas enfocadas en implementación, no en concepto
- [ ] Solicitan pricing o próximos pasos
- [ ] Comentan "esto resuelve nuestro problema"

---

**Versión:** PermitOps V1.0  
**Última actualización:** 2026-04-13  
**Próxima revisión:** Post-demo con feedback de Supermaxi
