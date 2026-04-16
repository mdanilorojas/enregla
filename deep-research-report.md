# Permisos y requisitos operativos por tipo de local para iniciar EnRegla V1 en Quito

## Resumen ejecutivo

Para comercializar EnRegla V1 en entity["city","Quito","pichincha, ecuador"] (con alcance Ecuador), conviene partir de un **núcleo común** aplicable a casi cualquier local con atención o instalación física: **RUC (SRI) → RAET/Patente municipal → LUAE → componente Bomberos (prevención de incendios)**. La **LUAE** se define como permiso municipal de funcionamiento y **contiene un código QR** para verificación por entidades de control; además, tiene “vigencia indefinida” con **renovación anual** condicionada a pagos/tasas y cumplimiento de reglas técnicas. citeturn27view1

Sobre ese núcleo, los permisos sectoriales cambian por giro:

- **Alimentos preparados (restaurante/cafetería/dark kitchen)**: el permiso “ancla” sectorial es el **Permiso de Funcionamiento ARCSA** (vigencia 1 año calendario; costos por categoría) y, típicamente, el **Permiso Anual de Funcionamiento** del entity["organization","Ministerio de Gobierno","ecuador interior ministry"] (categoría 4) que requiere, entre otros, **ARCSA + Bomberos + Patente/LUAE**. citeturn30view0turn24view0  
- **Retail alimenticio (supermercado/comisariato/minimarket con alimentos)**: el permiso “ancla” es **ARCSA Supermercado/Comisariato** (vigencia 1 año; costo publicado) y, si aplica por tipificación, el **Permiso Anual** del Ministerio de Gobierno (categoría 5). citeturn30view1turn24view0  
- **Consultorio/pequeña clínica**: el permiso “ancla” es el **Permiso de Funcionamiento ACESS** (vigencia 1 año), con requisitos específicos como **RUC activo, unicódigo RÚES, registros de títulos y responsable técnico**. citeturn17view0turn7view6 Si existe **rayos X**, hay una obligación crítica adicional: **licencia institucional para equipos generadores de radiación ionizante** (vigencia 4 años; costo publicado). citeturn10view5turn11view0  
- **Puesto/food truck en espacio público**: la pieza municipal típica es el **PUCA** (Permiso Único de Comercio Autónomo), con requisitos documentales (croquis, foto, planilla de servicios, certificado médico) y un costo calculado por fórmula; el flujo anual se concentra en pagos/entrega en enero. citeturn23view0turn23view1  
- **Farmacia**: el permiso “ancla” es **ARCSA Farmacia** (vigencia 1 año; costo publicado) y exige, por ejemplo, **contrato con químico/bioquímico farmacéutico**. citeturn8view3turn8view1

Para el MVP, la recomendación es **encapsular estos permisos en un “catálogo por tipo de negocio”**, con campos estandarizados y una grilla de uploads por documento, priorizando los permisos que tienen: (a) vencimiento anual, (b) inspección/validación externa, (c) riesgo operativo/sanitario alto.

## Marco común municipal y tributario

### Registro tributario y clave municipal

**RUC (tributario) — entity["organization","Servicio de Rentas Internas","ecuador tax authority"]**  
La inscripción del RUC para persona natural (y su equivalente por tipo de contribuyente) habilita la operación formal del negocio; el trámite oficial lista requisitos básicos (identificación, certificado de votación, documento de domicilio, etc.) y declara costo $0. citeturn18view0

**RAET (Patente municipal / acceso al sistema municipal) — entity["organization","Gobierno Autónomo Descentralizado del Distrito Metropolitano de Quito","municipal government quito"]**  
Para operar en Quito, el contribuyente con RUC debe inscribirse en el **RAET**, que entrega **número RAET y clave** para el sistema municipal de patentes/1.5 por mil. En línea, se requieren RUC, correo y **firma electrónica** (entre otros). citeturn19view0

**Declaración anual de Patente y 1.5×mil**  
La plataforma municipal describe este trámite como la declaración de impuesto de patente y 1.5×mil sobre activos, con reglas de calendario (p. ej., personas naturales no obligadas hasta mayo; obligadas/jurídicas desde junio) y señala que el trámite “no tiene costo” (pero sí genera impuestos a pagar). citeturn6view1turn9view6

### Licencia municipal de funcionamiento y verificación

**LUAE (Licencia Metropolitana Única para el Ejercicio de Actividades Económicas)**  
La ficha oficial municipal define la LUAE como permiso de funcionamiento, con **código QR** para verificación por entidades de control, y contempla categorías por impacto (simplificado/ordinario/especial). citeturn27view1  
Requisitos obligatorios destacados incluyen: haber obtenido registro y pago de Patente (si es exigible), conocer número de predio y mantener RUC actualizado. citeturn27view1  
La LUAE es digital, gratuita en el trámite (“no tiene costo”) y se remite por correo electrónico. citeturn7view0turn27view1

**Vigencia y renovación LUAE**  
La ficha municipal establece “vigencia indefinida, con renovación anual” condicionada a pagos/tasas y cumplimiento de reglas técnicas, y que la renovación se programa por **noveno dígito del RUC**. citeturn7view1turn27view1  
En comunicación municipal, también se enfatiza la necesidad de verificar **uso de suelo** y estar al día en obligaciones (p. ej., patente) antes de solicitar/renovar. citeturn16view0

### Componente Bomberos y prevención de incendios

El entity["organization","Cuerpo de Bomberos del Distrito Metropolitano de Quito","fire dept quito, ecuador"] vincula inspecciones y requisitos de prevención de incendios para el proceso LUAE y especifica que verifica condiciones como instalaciones de gas GLP, eléctricas, supresión/detección, medios de egreso, entre otros según actividad. citeturn20view0

En material técnico de inspecciones LUAE, se indica que:
- la inspección se asigna automáticamente tras el trámite municipal (no requiere ir a Bomberos a “solicitar” presencialmente), citeturn21view0  
- el trámite de inspección LUAE “no tiene costo”, citeturn21view0  
- y el **informe de inspección** para obtención de LUAE tiene vigencia **hasta el 31 de diciembre del año en curso**. citeturn21view0

### Rótulos/soportes publicitarios

Si el negocio usa **soportes publicitarios exteriores fijos** (casos típicos: estructuras, vallas, pantallas, soportes regulados), la municipalidad gestiona LMU 41A con requisitos (p. ej., número de predio, formato de soporte, póliza de responsabilidad civil para ciertos formatos), costos por m² como porcentaje del salario básico y vigencia de 1–4 años con año de vigencia Enero–Diciembre. citeturn15view0  
Para muchos negocios pequeños, esto puede ser **condicional** y se modela en EnRegla como “si aplica”.

## Matrices por tipo de negocio

A continuación se listan permisos **típicamente requeridos** (más condicionales comunes) por tipo de local. “Típicamente” importa: en Quito y Ecuador puede variar según categoría LUAE, ubicación, tamaño, y si se trata de actividad mixta (p. ej., restaurante con farmacia, supermercado con panadería, clínica con rayos X).

### Restaurante, cafetería y dark kitchen

| Permiso / requisito | Autoridad | Vigencia / renovación | Costos publicados | Documentos/soportes clave para EnRegla |
|---|---|---|---|---|
| RAET (registro/clave Patente municipal) | GAD Quito | Vigente mientras RAET activo; trámite sin costo | Trámite $0 | RUC, acuerdo de medios electrónicos firmado (PDF), RAET (número), credenciales. citeturn19view0 |
| Declaración Patente municipal | GAD Quito | Anual (según calendario) | Trámite $0; impuestos según declaración | Orden/comprobante de pago, año fiscal, formulario/soporte si aplica. citeturn9view6 |
| LUAE | GAD Quito | Indefinida con renovación anual por noveno dígito RUC; QR verificable | Trámite $0 | LUAE (PDF con QR), predio, categoría, “mes de renovación”. citeturn27view1turn7view1 |
| Bomberos – inspección LUAE (prevención de incendios) | Bomberos DMQ | Informe hasta 31-dic del año en curso; trámite sin costo | $0 | Informe/certificado (PDF), fecha inspección, observaciones, resultado. citeturn21view0turn20view0 |
| Permiso ARCSA restaurantes/cafeterías (alimentación colectiva) | entity["organization","ARCSA","ecuador sanitary agency"] | 1 año calendario desde emisión; renovable anual | $55,20–$331,40 según categoría | Permiso (PDF), RUC; y, según ficha, categorización Mintur (documento). citeturn30view0 |
| Permiso Anual de Funcionamiento (Categoría 4: alimentos preparados) | Ministerio de Gobierno (Intendencias) | 1 año fiscal desde emisión; pago en primeros 3 meses del año fiscal | USD 21,89 (cat. 4) | Permiso anual (PDF), comprobante pago, RUC, Patente/LUAE, Bomberos, ARCSA (cat.4). citeturn24view0 |

**Notas operativas importantes para EnRegla**
- ARCSA describe un flujo en el que se imprime orden de pago, el pago se realiza “al siguiente día hábil”, y luego se descarga/imprime el permiso; esto se puede modelar como “en trámite” → “vigente” al cargar el PDF del permiso y/o comprobante. citeturn30view0  
- Si el restaurante expende bebidas alcohólicas, el Permiso Anual del Ministerio de Gobierno explícitamente cubre lugares donde se consuman/expendan alimentos y/o bebidas alcohólicas (cuando no están regulados por Turismo). citeturn24view0  

### Pequeña tienda retail

Hay dos escenarios prácticos:

**Retail general (papelería, bazar, ropa, etc.)**: base municipal/tributaria + LUAE y, según categoría, componente Bomberos.

**Retail alimenticio (minimarket, comisariato, tienda con alimentos)**: añade ARCSA (y potencialmente Permiso Anual categoría 5).

| Permiso / requisito | Autoridad | Vigencia / renovación | Costos publicados | Documentos/soportes clave |
|---|---|---|---|---|
| LUAE (con QR) | GAD Quito | Indefinida con renovación anual | Trámite $0 | LUAE (PDF) + datos predio. citeturn27view1 |
| Bomberos – inspección LUAE (si aplica por categoría) | Bomberos DMQ | Informe hasta 31-dic del año en curso; $0 | $0 | Informe/certificado (PDF). citeturn21view0 |
| ARCSA Supermercado/Comisariato (si expende alimentos/bebidas, etc.) | ARCSA | 1 año calendario | USD 331,20 | Permiso (PDF), RUC, y evidencia de orden/pago si se gestiona. citeturn30view1turn26view0 |
| Permiso Anual de Funcionamiento (Categoría 5: supermercados y bodegas) | Ministerio de Gobierno | 1 año fiscal desde emisión | USD 623,94 (cat.5) | Permiso anual (PDF), RUC, Patente/LUAE, Bomberos + comprobante de pago. citeturn24view0 |

**Nota de mezcla de actividades**: ARCSA señala que un supermercado/comisariato puede incluir sección de farmacia, pero debe estar identificada y la actividad debe constar en el permiso o segregarse físicamente. Esto es valioso para la lógica de “actividades por sede” en onboarding. citeturn26view0

### Consultorio o pequeña clínica

| Permiso / requisito | Autoridad | Vigencia / renovación | Costos publicados | Documentos/soportes clave |
|---|---|---|---|---|
| LUAE (con QR) | GAD Quito | Indefinida con renovación anual | Trámite $0 | LUAE PDF con QR. citeturn27view1 |
| Bomberos – prevención de incendios (según categoría) | Bomberos DMQ | Informe hasta 31-dic del año en curso; $0 | $0 | Informe Bomberos LUAE. citeturn21view0turn20view0 |
| Permiso de funcionamiento de prestadores de salud | entity["organization","ACESS","ecuador health quality agency"] | 1 año calendario | Costos por tipología (ver tabla ACESS) | RUC activo; unicódigo RÚES; registros de títulos; documento de designación de responsable técnico; cartera de servicios presentada en inspección in situ. citeturn17view0turn7view6 |
| Gestión de desechos sanitarios (si genera infecciosos/cortopunzantes/fármacos caducados, etc.) | entity["organization","EMGIRS-EP","quito waste management company"] | Contrato/servicio; tarifas por kg | Tarifas publicadas por kg (p.ej. $0,99–$2,07 según tipo/código) | Para contrato: RUC (PDF), planillas (PDF), cédulas/nombramientos (PDF), predio, firma electrónica. citeturn12view2 |
| Licencia institucional para equipos de rayos X (solo si hay radiología) | entity["organization","Ministerio de Ambiente y Energía","ecuador env & energy ministry"] | 4 años | USD 4,00 + IVA por equipo | Oficio de cumplimiento al informe de inspección radiológica, factura/pago, firma electrónica; licencia institucional es el documento que autoriza a poseer/operar equipos para uso médico. citeturn10view4turn10view5turn11view0 |

**Nota importante sobre “registro de generador de desechos peligrosos”**  
El trámite nacional para registro de generadores de residuos peligrosos/especiales excluye/da tratamiento especial a establecimientos de salud descritos en la normativa citada en su base legal (p. ej., consultorios, radiología e imagen, etc.), indicando que no estarían sujetos a obtener ese registro, aunque deben acatar otras disposiciones ambientales y sanitarias aplicables. Esto apoya un enfoque MVP: **en consultorios pequeños, priorizar contrato/gestión sanitaria municipal + cumplimiento interno**, antes de modelar un registro ambiental complejo. citeturn29view0

### Food truck / puesto en espacio público

En Quito, si el negocio opera **en espacio público** como comercio autónomo, el eje típico es el **PUCA**. Si además prepara alimentos, suele volverse relevante ARCSA (alimentación colectiva) y controles de higiene/seguridad.

| Permiso / requisito | Autoridad | Vigencia / renovación | Costos publicados | Documentos/soportes clave |
|---|---|---|---|---|
| PUCA (fijo/semifijo) | GAD Quito (Administraciones zonales) | Flujo anual con pago/entrega en enero | Costo por fórmula (ejemplo publicado) | Croquis del punto (JPG/PDF), foto solicitante, planilla servicios (PDF), certificado médico (PDF), (opcional) carnet discapacidad. citeturn23view0turn22view0 |
| PUCA (ambulante/transportación) | GAD Quito (Agencia de comercio) | Flujo anual con pago/entrega en enero | Costo por fórmula (ejemplo publicado) | Foto, planilla servicios, certificado médico; (opcional) carnet discapacidad. citeturn23view1turn22view1 |
| ARCSA restaurantes/cafeterías (si expende alimentos preparados) | ARCSA | 1 año calendario | $55,20–$331,40 según categoría | Permiso ARCSA (PDF), RUC; y requisitos según ficha. citeturn30view0 |

**Reglas operativas del PUCA que EnRegla puede convertir en “alertas de calendario”**
- En los instructivos PUCA se indica que el título de crédito/“regalía” se consulta/remite en los primeros días de enero, se paga hasta el 25 de enero y los permisos del año en curso se entregan hasta el 31 de enero. citeturn22view0turn23view1

### Farmacia

| Permiso / requisito | Autoridad | Vigencia / renovación | Costos publicados | Documentos/soportes clave |
|---|---|---|---|---|
| ARCSA Permiso de funcionamiento Farmacia | ARCSA | 1 año calendario | USD 66,24 | RUC; formulario ARCSA; contrato con químico/bioquímico farmacéutico (según jornada/horas). citeturn8view0turn8view1turn8view3 |
| Autorización de apertura (relacionado, según caso) | ARCSA | (no especificado en la ficha breve) | (no especificado en la ficha breve) | Proceso descrito como solicitud de autorización de apertura previa a obtención del permiso de funcionamiento. citeturn0search17 |
| Desechos sanitarios/peligrosos (fármacos caducados, etc.) | EMGIRS-EP | Servicio/contrato; tarifas por kg | Tarifas publicadas por kg por códigos | En la descripción de servicio EMGIRS se incluyen “fármacos caducados o fuera de especificaciones” dentro de la cobertura del servicio y tarifas. citeturn12view2 |

## Mapeo a campos y grilla de uploads para EnRegla

### Campos base para cualquier permiso

**Tabla: `permits` (campos mínimos recomendados)**

| Campo | Tipo | Req. | Ejemplo | Notas MVP |
|---|---|---:|---|---|
| `permit_type` | enum/string | ✓ | `LUAE_Quito` | Catálogo controlado por EnRegla |
| `display_name` | string | ✓ | `LUAE` | UI |
| `issuing_authority` | string | ✓ | `GADDMQ` | Texto libre + catálogo |
| `scope` | enum | ✓ | `municipal` / `nacional` | Reporting |
| `status` | enum | ✓ | `vigente` / `por_vencer` / `vencido` / `en_tramite` / `no_registrado` | Estados operativos |
| `issue_date` | date | ✓* | `2026-02-15` | *Puede ser opcional si está “no_registrado” |
| `expiry_date` | date | ○ | `2027-02-14` | Para LUAE se recomienda modelar “cierre de período anual” |
| `renewal_cycle` | enum | ✓ | `anual` / `fiscal` / `4_anios` / `indefinida_con_renovacion_anual` | Calcular alertas |
| `renewal_hint` | string | ○ | `Mes: Octubre (RUC 9)` | Útil para LUAE / PUCA |
| `reference_number` | string | ○ | `LUAE-2026-000123` | Número/serie si existe |
| `location_name` | string | ✓ | `Sede Norte` | Para import demo |
| `risk_level` | enum | ✓ | `critico` / `alto` / `medio` / `bajo` | Drive de alertas |
| `notes_internal` | text | ○ | `Renovar en octubre` | No se muestra en vista externa |

### Campos adicionales por permiso (solo cuando aplica)

| `permit_type` | Campos extra | Tipo | Req. | Fuente (por qué existe) |
|---|---|---|---:|---|
| `LUAE_Quito` | `predio_number`, `luae_category`, `qr_present`, `ruc_9th_digit`, `renewal_month` | string/enum/bool | ✓/○ | LUAE usa predio, categoriza por impacto y contiene QR; renovación por noveno dígito. citeturn27view1turn7view1 |
| `RAET_Quito` | `raet_number`, `digital_signature_used` | string/bool | ✓/○ | RAET entrega número RAET y clave; en línea exige firma electrónica. citeturn19view0 |
| `PATENTE_Quito` | `tax_year`, `payment_order_id` | int/string | ✓/○ | Declaración anual y comprobante/orden. citeturn9view6 |
| `BOMBEROS_LUAE` | `inspection_result`, `valid_until_year_end` | enum/date | ✓ | Valididad hasta 31-dic; inspección/verificación técnica. citeturn21view0turn20view0 |
| `ARCSA_PF_RESTAURANTE` | `arcsa_category_code`, `mintur_categorization_ref`, `fee_usd` | string/string/number | ○/○/✓ | ARCSA define categorías/costos y vigencia 1 año; requiere categorización Mintur según ficha. citeturn30view0 |
| `ARCSA_PF_SUPERMERCADO` | `arcsa_category_code`, `fee_usd` | string/number | ✓ | Costo y vigencia publicados. citeturn30view1 |
| `ARCSA_PF_FARMACIA` | `fee_usd`, `pharmacist_contract_present` | number/bool | ✓ | Exige contrato con químico/bioquímico farmacéutico; costo/vigencia publicado. citeturn8view3turn8view1 |
| `MIN_GOB_PAF_CAT4_5_7` | `category`, `fee_usd`, `intendencia_provincia` | enum/number/string | ✓ | Requisitos incluyen RUC, Patente/LUAE, Bomberos; ARCSA solo cat 4; y costos publicados por categoría. citeturn24view0 |
| `ACESS_PF_SALUD` | `rues_unicodigo`, `responsable_tecnico`, `cartera_servicios_uploaded` | string/string/bool | ✓/✓/○ | ACESS requiere unicódigo RÚES, responsable técnico y cartera de servicios en inspección. citeturn17view0turn7view6 |
| `MAE_LIC_RAYOSX_MED` | `equipment_count`, `inspection_report_ref`, `fee_usd_per_unit` | int/string/number | ○/✓/✓ | Licencia institucional para operar equipos; requisito: oficio de cumplimiento a informe de inspección; costo $4+IVA por equipo; vigencia 4 años. citeturn10view4turn10view5turn11view0 |
| `PUCA` | `puca_type`, `admin_zonal`, `regalia_due_date` | enum/string/date | ✓/✓/○ | Requisitos: croquis, foto, planilla, certificado médico; pago hasta 25-ene y entrega hasta 31-ene. citeturn23view0turn22view0turn23view1 |
| `LMU_41A` | `support_format`, `area_m2`, `valid_years`, `insurance_policy_required` | enum/number/int/bool | ○/○/✓/○ | LMU 41A requisitos/costos por m² y vigencias 1–4 años. citeturn15view0 |
| `EMGIRS_DESECHOS` | `contract_id`, `tariff_per_kg`, `service_type` | string/number/string | ○/○/○ | Requisitos/contrato y tarifas por kg publicadas. citeturn12view2 |

### Grilla de uploads por permit (documentos PDF “mínimos”)

En EnRegla, cada permiso debería soportar **uno o varios “documentos de respaldo”** en PDF. Sugerencia de tipos (`doc_type`) y obligatoriedad:

- **LUAE_Quito**: `luae_pdf` (obligatorio), opcional `manual_solicitud` / `otros_requisitos`. citeturn27view1  
- **BOMBEROS_LUAE**: `informe_inspeccion_bomberos_pdf` (obligatorio). citeturn21view0  
- **ARCSA_PF_RESTAURANTE/SUPERMERCADO/FARMACIA**: `permiso_arcsa_pdf` (obligatorio), opcional `orden_pago_pdf`, `comprobante_pago_pdf`. citeturn30view0turn30view1turn8view3  
- **MIN_GOB_PAF**: `permiso_min_gob_pdf` (obligatorio), opcional `comprobante_pago_pdf`. citeturn24view0  
- **ACESS_PF_SALUD**: `permiso_acess_pdf` (obligatorio), `designacion_responsable_tecnico_pdf` (recomendado), `cartera_servicios_pdf` (recomendado). citeturn17view0turn7view6  
- **MAE_LIC_RAYOSX_MED**: `licencia_institucional_pdf` (obligatorio), `informe_inspeccion_radiologica_pdf` (obligatorio). citeturn10view4turn11view0  
- **PUCA**: `croquis_pdf`, `foto_solicitante`, `planilla_servicio_basico_pdf`, `certificado_medico_pdf` (obligatorios según tipo); `carnet_discapacidad_pdf` (opcional). citeturn23view0turn23view1  
- **EMGIRS_DESECHOS**: `contrato_emgirs_pdf` (recomendado), y (según persona natural/jurídica) `ruc_pdf`, `planilla_pdf`, `nombramiento_pdf`, `cedula_pdf`. citeturn12view2  

### Esquema de importación CSV/JSON para demo

**Import CSV sugerido (una fila = un permiso en una sede)**  
Columnas recomendadas:

- `company_name`
- `business_type`
- `location_name`
- `location_address`
- `permit_type`
- `issuing_authority`
- `status`
- `issue_date`
- `expiry_date`
- `renewal_cycle`
- `renewal_hint`
- `reference_number`
- `fee_usd`
- `risk_level`
- `required_files` (lista separada por `|`)
- `uploaded_files` (lista separada por `|`)

**JSON schema conceptual (por registro)**: mismo set de campos con tipos equivalentes (string/date/number/enum).

## Riesgos críticos, alertas sugeridas y checklist de seed

### Permisos críticos por riesgo operativo/sanitario

1) **Radiología / rayos X sin licencia institucional (crítico)**  
La licencia institucional se define como el documento que autoriza a una institución a poseer/operar y prestar servicios con equipos generadores de radiación ionizante para uso médico, con vigencia de 4 años y requisitos ligados a inspección radiológica. citeturn11view0turn10view4turn10view3

**Copy UI recomendado**
- Alerta crítica (interna): “Radiología: falta licencia institucional vigente (rayos X)”.
- Subtexto: “Cargue la licencia y el informe de inspección radiológica.”
- CTA: “Registrar licencia”.

2) **Consultorio/servicio de salud sin permiso ACESS (alto/crítico según caso)**  
ACESS lista el permiso de funcionamiento para prestadores de salud con vigencia anual y requisitos (RUC activo, unicódigo RÚES, responsable técnico, etc.). citeturn17view0turn7view6  

**Copy UI recomendado**
- Alerta: “Salud: permiso de funcionamiento por vencer en X días”.
- Si faltante: “Salud: permiso de funcionamiento no registrado”.
- CTA: “Subir certificado”.

3) **Alimentos preparados sin Permiso ARCSA (alto)**  
ARCSA fija vigencia anual del permiso y costos por categoría, con flujo de orden de pago y descarga del permiso. citeturn30view0  

**Copy UI recomendado**
- Alerta: “ARCSA: permiso por vencer en X días”.
- Si faltante: “ARCSA: permiso no registrado (restaurantes/cafeterías)”.
- CTA: “Registrar permiso”.

4) **Prevención de incendios (Bomberos LUAE) vencida a fin de año (alto)**  
El informe de inspección de Bomberos para LUAE se indica vigente hasta el 31 de diciembre del año en curso. citeturn21view0  

**Copy UI recomendado**
- Alerta estacional: “Bomberos: informe vigente hasta 31 de diciembre. Programar inspección/renovación.”
- CTA: “Marcar en trámite”.

5) **Operación en espacio público sin PUCA (alto)**  
PUCA exige documentos específicos y tiene plazos de pago/entrega en enero. citeturn23view0turn23view1  

**Copy UI recomendado**
- Alerta enero: “PUCA: pago de regalía pendiente (vence 25 de enero)”.
- Si faltante: “PUCA: permiso no registrado (comercio en espacio público)”.

### Checklist priorizado para seed de onboarding por tipo de negocio

**Común (todas las empresas con sede fija)**
- RUC (dato empresa, no solo documento) citeturn18view0  
- RAET (número + credenciales / acuerdo firmado) citeturn19view0  
- Patente (año fiscal + comprobante pago) citeturn9view6  
- LUAE (PDF + predio + categoría + mes renovación) citeturn27view1turn7view1  
- Bomberos (informe inspección + vencimiento 31-dic) citeturn21view0  

**Restaurante/cafetería/dark kitchen**
- ARCSA restaurantes/cafeterías citeturn30view0  
- Permiso Anual Ministerio de Gobierno (cat 4) citeturn24view0  

**Retail alimenticio**
- ARCSA supermercado/comisariato citeturn30view1  
- Ministerio de Gobierno (cat 5) si aplica citeturn24view0  

**Consultorio/pequeña clínica**
- Permiso ACESS citeturn17view0turn7view6  
- EMGIRS (si genera desechos sanitarios/peligrosos; contrato/soportes) citeturn12view2  
- Licencia radiológica (solo si hay rayos X) citeturn10view5turn11view0  

**Food truck/puesto**
- PUCA (según tipo) citeturn23view0turn23view1  
- ARCSA (si prepara alimentos) citeturn30view0  

**Farmacia**
- ARCSA Farmacia (contrato con profesional) citeturn8view3turn8view1  
- (Relacionado) autorización de apertura según caso citeturn0search17  

### Ejemplos de CSV de demo por tipo de negocio

A continuación, muestras “realistas” (datos ficticios) con el esquema propuesto. En LUAE se recomienda usar `expiry_date` como **cierre del período anual** para controlar alertas, aunque la ficha municipal hable de vigencia indefinida con renovación anual. citeturn7view1

```csv
company_name,business_type,location_name,location_address,permit_type,issuing_authority,status,issue_date,expiry_date,renewal_cycle,renewal_hint,reference_number,fee_usd,risk_level,required_files,uploaded_files
Cafe Aurora S.A.,restaurante_cafeteria,Café Aurora - Iñaquito,"Av. Amazonas N34-451 y Atahualpa, Quito",RAET_Quito,GADDMQ,vigente,2026-01-10,,indefinida,,RAET-UIO-102938,,medio,"acuerdo_raet_firmado.pdf|certificado_raet.pdf","acuerdo_raet_firmado.pdf|certificado_raet.pdf"
Cafe Aurora S.A.,restaurante_cafeteria,Café Aurora - Iñaquito,"Av. Amazonas N34-451 y Atahualpa, Quito",PATENTE_Quito,GADDMQ,vigente,2026-06-20,2026-12-31,anual,"Declaración anual","PAT-2026-000771",,medio,"comprobante_pago_patente.pdf","comprobante_pago_patente.pdf"
Cafe Aurora S.A.,restaurante_cafeteria,Café Aurora - Iñaquito,"Av. Amazonas N34-451 y Atahualpa, Quito",LUAE_Quito,GADDMQ,vigente,2026-02-05,2026-12-31,indefinida_con_renovacion_anual,"Renueva: Octubre (RUC 9)","LUAE-2026-001234",0,bajo,"luae.pdf","luae.pdf"
Cafe Aurora S.A.,restaurante_cafeteria,Café Aurora - Iñaquito,"Av. Amazonas N34-451 y Atahualpa, Quito",BOMBEROS_LUAE,Bomberos DMQ,vigente,2026-02-12,2026-12-31,anual,"Vence: 31-dic","CBQ-LUAE-2026-7788",0,alto,"informe_bomberos.pdf","informe_bomberos.pdf"
Cafe Aurora S.A.,restaurante_cafeteria,Café Aurora - Iñaquito,"Av. Amazonas N34-451 y Atahualpa, Quito",ARCSA_PF_RESTAURANTE,ARCSA,vigente,2026-04-05,2027-04-04,anual,"Renueva: abril","ARCSA-PF-REST-88991",110.40,alto,"permiso_arcsa.pdf","permiso_arcsa.pdf"
Cafe Aurora S.A.,restaurante_cafeteria,Café Aurora - Iñaquito,"Av. Amazonas N34-451 y Atahualpa, Quito",MIN_GOB_PAF_CAT4,Ministerio de Gobierno,vigente,2026-02-15,2027-02-14,fiscal,"Pago anual: Q1","PAF-C4-UIO-2026-0042",21.89,medio,"permiso_min_gob.pdf|comprobante_pago.pdf","permiso_min_gob.pdf|comprobante_pago.pdf"
```

```csv
company_name,business_type,location_name,location_address,permit_type,issuing_authority,status,issue_date,expiry_date,renewal_cycle,renewal_hint,reference_number,fee_usd,risk_level,required_files,uploaded_files
MiniMarket La Esquina,retail_alimenticio,MiniMarket - Centro,"Olmedo y Guayaquil (ficticio), Quito",LUAE_Quito,GADDMQ,vigente,2026-03-01,2026-12-31,indefinida_con_renovacion_anual,"Renueva: Noviembre (RUC 0)","LUAE-2026-009900",0,bajo,"luae.pdf","luae.pdf"
MiniMarket La Esquina,retail_alimenticio,MiniMarket - Centro,"Olmedo y Guayaquil (ficticio), Quito",BOMBEROS_LUAE,Bomberos DMQ,vigente,2026-03-10,2026-12-31,anual,"Vence: 31-dic","CBQ-LUAE-2026-1200",0,alto,"informe_bomberos.pdf","informe_bomberos.pdf"
MiniMarket La Esquina,retail_alimenticio,MiniMarket - Centro,"Olmedo y Guayaquil (ficticio), Quito",ARCSA_PF_SUPERMERCADO,ARCSA,vigente,2026-04-12,2027-04-11,anual,"Renueva: abril","ARCSA-PF-SUP-55112",331.20,alto,"permiso_arcsa.pdf","permiso_arcsa.pdf"
MiniMarket La Esquina,retail_alimenticio,MiniMarket - Centro,"Olmedo y Guayaquil (ficticio), Quito",MIN_GOB_PAF_CAT5,Ministerio de Gobierno,en_tramite,2026-01-20,2027-01-19,fiscal,"Pago anual: Q1","PAF-C5-UIO-2026-0031",623.94,medio,"permiso_min_gob.pdf|comprobante_pago.pdf","comprobante_pago.pdf"
```

```csv
company_name,business_type,location_name,location_address,permit_type,issuing_authority,status,issue_date,expiry_date,renewal_cycle,renewal_hint,reference_number,fee_usd,risk_level,required_files,uploaded_files
Consultorio Vida Norte,consultorio_medico,Consultorio - La Carolina,"Av. Portugal y Shyris (ficticio), Quito",LUAE_Quito,GADDMQ,vigente,2026-02-20,2026-12-31,indefinida_con_renovacion_anual,"Renueva: Julio (RUC 6)","LUAE-2026-004321",0,bajo,"luae.pdf","luae.pdf"
Consultorio Vida Norte,consultorio_medico,Consultorio - La Carolina,"Av. Portugal y Shyris (ficticio), Quito",ACESS_PF_SALUD,ACESS,por_vencer,2025-05-02,2026-05-01,anual,"Renueva: mayo","ACESS-PF-UIO-2025-77881",,critico,"permiso_acess.pdf|designacion_responsable_tecnico.pdf","permiso_acess.pdf|designacion_responsable_tecnico.pdf"
Consultorio Vida Norte,consultorio_medico,Consultorio - La Carolina,"Av. Portugal y Shyris (ficticio), Quito",EMGIRS_DESECHOS,EMGIRS-EP,vigente,2026-01-15,2026-12-31,anual,"Contrato anual","EMGIRS-CTR-2026-0199",,alto,"contrato_emgirs.pdf","contrato_emgirs.pdf"
Consultorio Vida Norte,consultorio_medico,Consultorio - La Carolina,"Av. Portugal y Shyris (ficticio), Quito",MAE_LIC_RAYOSX_MED,MAE,vigente,2026-01-10,2030-01-09,4_anios,"4 años","DLPR-LIC-C-UIO-00088",4.00,critico,"licencia_rayosx.pdf|informe_inspeccion_radiologica.pdf","licencia_rayosx.pdf|informe_inspeccion_radiologica.pdf"
```

```csv
company_name,business_type,location_name,location_address,permit_type,issuing_authority,status,issue_date,expiry_date,renewal_cycle,renewal_hint,reference_number,fee_usd,risk_level,required_files,uploaded_files
Food Truck ÑamÑam,food_truck_puesto,ÑamÑam - Parque (Puesto Fijo),"Espacio público autorizado (ficticio), Quito",PUCA_FIJO_SEMIFIJO,GADDMQ,vigente,2026-01-28,2026-12-31,anual,"Pago regalía: antes 25-ene; entrega: hasta 31-ene","PUCA-2026-00455",,alto,"croquis.pdf|foto.jpg|planilla.pdf|certificado_medico.pdf","croquis.pdf|foto.jpg|planilla.pdf|certificado_medico.pdf"
Food Truck ÑamÑam,food_truck_puesto,ÑamÑam - Parque (Puesto Fijo),"Espacio público autorizado (ficticio), Quito",ARCSA_PF_RESTAURANTE,ARCSA,en_tramite,2026-04-10,2027-04-09,anual,"Pago al siguiente día hábil","ARCSA-PF-REST-11234",55.20,alto,"permiso_arcsa.pdf|comprobante_pago.pdf","comprobante_pago.pdf"
```

```csv
company_name,business_type,location_name,location_address,permit_type,issuing_authority,status,issue_date,expiry_date,renewal_cycle,renewal_hint,reference_number,fee_usd,risk_level,required_files,uploaded_files
Farmacia San Miguel,farmacia,Farmacia - Sur,"Av. Maldonado y Quimiag (ficticio), Quito",LUAE_Quito,GADDMQ,vigente,2026-02-08,2026-12-31,indefinida_con_renovacion_anual,"Renueva: Agosto (RUC 7)","LUAE-2026-007700",0,bajo,"luae.pdf","luae.pdf"
Farmacia San Miguel,farmacia,Farmacia - Sur,"Av. Maldonado y Quimiag (ficticio), Quito",ARCSA_PF_FARMACIA,ARCSA,vigente,2026-03-14,2027-03-13,anual,"Renueva: marzo","ARCSA-PF-FAR-00991",66.24,alto,"permiso_arcsa.pdf|contrato_quimico_farmaceutico.pdf","permiso_arcsa.pdf|contrato_quimico_farmaceutico.pdf"
Farmacia San Miguel,farmacia,Farmacia - Sur,"Av. Maldonado y Quimiag (ficticio), Quito",EMGIRS_DESECHOS,EMGIRS-EP,en_tramite,2026-04-01,2026-12-31,anual,"Gestión de desechos (incluye fármacos caducados)","EMGIRS-CTR-2026-0330",,medio,"contrato_emgirs.pdf",""
```

## Fuentes oficiales principales consultadas

- Ficha municipal LUAE (definición, QR, requisitos, costo, vigencia/renovación, cronograma por noveno dígito, componentes de inspección). citeturn27view1turn7view1turn7view0turn7view2  
- Registro RAET (Patente) y declaración de Patentes/1.5×mil (requisitos, calendario, costos del trámite). citeturn19view0turn9view6turn6view1  
- Guía/inspecciones LUAE de Bomberos Quito (costo inspección, validez informe, aspectos inspeccionados). citeturn21view0turn20view0  
- ARCSA: permisos de funcionamiento para restaurantes/cafeterías y para supermercados/comisariatos (requisitos, pasos, costos y vigencias). citeturn30view0turn30view1turn26view0  
- ARCSA: permisos de funcionamiento para farmacias/botiquines (requisitos, contrato con profesional, costos, vigencia). citeturn8view3turn8view1turn8view0  
- Ministerio de Gobierno: Permiso Anual de Funcionamiento (definición, requisitos, costos por categoría 4/5/7, vigencia). citeturn24view0  
- ACESS: permiso de funcionamiento prestadores de salud (requisitos, vigencia, referencia de costos por tipología). citeturn17view0turn7view6turn17view3  
- Ministerio de Ambiente y Energía: licencia institucional para equipos generadores de radiación ionizante uso médico (requisitos, costo, vigencia 4 años; rol de inspección). citeturn10view4turn10view5turn10view3turn11view0  
- PUCA (GADDMQ, documentos oficiales firmados en Gob.EC): requisitos documentales, fórmula de costo, fechas/flujo de pago y entrega. citeturn23view0turn23view1turn22view0turn22view1  
- EMGIRS: requisitos para contrato de desechos sanitarios y tarifas por kg (incluye fármacos caducados). citeturn12view2  
- LMU 41A: licencia metropolitana urbanística de soportes publicitarios exteriores (requisitos, costos por m², vigencia). citeturn15view0