import type { BusinessTypeDef } from '../types';

// Seed para clínicas / consultorios médicos en Ecuador.
// Fundamentado en research: ACESS (permiso de funcionamiento de establecimientos
// de salud y registro de profesionales), ARCSA (BPM cuando maneja medicamentos /
// alimentos), Municipio (uso de suelo, LUAE/patente), Cuerpo de Bomberos, gestión
// de desechos biopeligrosos + licencia ambiental SUIA/MAATE, SRI e IESS/MDT.
// Las condiciones `appliesWhen` encienden requisitos según los datos capturados.

export const clinica: BusinessTypeDef = {
  slug: 'clinica',
  name: 'Clínica / Consultorio médico',
  description:
    'Establecimiento de salud: consultorios, clínicas y centros médicos.',
  active: true,
  inputFields: [
    {
      key: 'area_m2',
      label: 'Área del local',
      type: 'number',
      required: true,
      unit: 'm²',
      placeholder: 'Ej. 120',
    },
    {
      key: 'staff_count',
      label: 'Número total de personal',
      type: 'number',
      required: true,
      placeholder: 'Ej. 8',
      help: 'Incluye personal administrativo y de salud.',
    },
    {
      key: 'health_professionals',
      label: 'Profesionales de salud',
      type: 'number',
      required: true,
      placeholder: 'Ej. 4',
      help: 'Médicos, odontólogos, enfermería, etc.',
    },
    {
      key: 'services',
      label: 'Servicios que ofrece',
      type: 'multiselect',
      options: [
        { value: 'consulta_externa', label: 'Consulta externa' },
        { value: 'imagenologia', label: 'Imagenología / Rayos X' },
        { value: 'laboratorio', label: 'Laboratorio clínico' },
        { value: 'farmacia_interna', label: 'Farmacia interna' },
        { value: 'procedimientos_menores', label: 'Procedimientos menores' },
        { value: 'hospitalizacion', label: 'Hospitalización' },
        { value: 'odontologia', label: 'Odontología' },
      ],
    },
    {
      key: 'handles_medications',
      label: '¿Maneja o almacena medicamentos / insumos?',
      type: 'boolean',
    },
    {
      key: 'generates_biohazard',
      label: '¿Genera desechos biopeligrosos?',
      type: 'boolean',
      help: 'Cortopunzantes, material contaminado, biológicos.',
    },
    {
      key: 'sells_food',
      label: '¿Vende alimentos o bebidas?',
      type: 'boolean',
      help: 'Cafetería, máquinas expendedoras, etc.',
    },
  ],
  requirements: [
    // --- Funcionamiento (siempre aplican) ---
    {
      code: 'uso_suelo',
      area: 'funcionamiento',
      name: 'Certificado de Uso de Suelo',
      authority: 'Municipio (GAD)',
      description:
        'Compatibilidad del local con la actividad de salud según zonificación municipal.',
      mandatory: true,
      renewal: 'unico',
      legalReference: 'Ordenanzas municipales de uso y ocupación de suelo',
    },
    {
      code: 'luae_patente',
      area: 'funcionamiento',
      name: 'LUAE / Patente Municipal',
      authority: 'Municipio (GAD)',
      description:
        'Licencia única de actividades económicas y patente para operar en el cantón.',
      mandatory: true,
      renewal: 'anual',
      legalReference: 'COOTAD; ordenanzas municipales',
    },
    {
      code: 'bomberos',
      area: 'funcionamiento',
      name: 'Permiso de Funcionamiento de Bomberos',
      authority: 'Cuerpo de Bomberos',
      description:
        'Inspección de prevención de incendios y condiciones de seguridad del local.',
      mandatory: true,
      renewal: 'anual',
      legalReference: 'Reglamento de Prevención de Incendios',
    },
    {
      code: 'acess_pf',
      area: 'funcionamiento',
      name: 'Permiso de Funcionamiento ACESS',
      authority: 'ACESS',
      description:
        'Permiso de funcionamiento del establecimiento de salud, base para operar legalmente.',
      mandatory: true,
      renewal: 'anual',
      legalReference: 'Normativa ACESS para establecimientos de salud',
    },
    // --- Sectorial (condicionales) ---
    {
      code: 'acess_profesionales',
      area: 'sectorial',
      name: 'Registro de profesionales de salud',
      authority: 'ACESS',
      description:
        'Registro y validación del talento humano de salud que labora en el establecimiento.',
      mandatory: true,
      renewal: 'periodico',
      legalReference: 'Normativa ACESS de talento humano en salud',
      appliesWhen: [{ field: 'health_professionals', gt: 0 }],
    },
    {
      code: 'arcsa_bpm',
      area: 'sectorial',
      name: 'Registro / BPM ARCSA (medicamentos e insumos)',
      authority: 'ARCSA',
      description:
        'Permiso sanitario y buenas prácticas para manejo y almacenamiento de medicamentos e insumos.',
      mandatory: true,
      renewal: 'anual',
      legalReference: 'Normativa técnica sanitaria ARCSA',
      appliesWhen: [{ field: 'handles_medications', eq: true }],
    },
    {
      code: 'desechos_biopeligrosos',
      area: 'sectorial',
      name: 'Gestión de desechos biopeligrosos',
      authority: 'Gestor ambiental autorizado / GAD',
      description:
        'Contrato con gestor calificado para recolección y disposición de desechos sanitarios.',
      mandatory: true,
      renewal: 'periodico',
      legalReference: 'Reglamento de manejo de desechos sanitarios',
      appliesWhen: [{ field: 'generates_biohazard', eq: true }],
    },
    {
      code: 'licencia_ambiental',
      area: 'sectorial',
      name: 'Registro / Licencia Ambiental (SUIA)',
      authority: 'MAATE (SUIA)',
      description:
        'Regularización ambiental del establecimiento por generación de desechos peligrosos.',
      mandatory: true,
      renewal: 'unico',
      legalReference: 'SUIA — Sistema Único de Información Ambiental',
      appliesWhen: [{ field: 'generates_biohazard', eq: true }],
    },
    {
      code: 'arcsa_alimentos',
      area: 'sectorial',
      name: 'Permiso ARCSA de alimentos y bebidas',
      authority: 'ARCSA',
      description:
        'Permiso sanitario para venta o expendio de alimentos y bebidas en el local.',
      mandatory: true,
      renewal: 'anual',
      legalReference: 'Normativa técnica sanitaria ARCSA (alimentos)',
      appliesWhen: [{ field: 'sells_food', eq: true }],
    },
    // --- SRI (siempre) ---
    {
      code: 'ruc',
      area: 'sri',
      name: 'RUC activo',
      authority: 'SRI',
      description:
        'Registro Único de Contribuyentes habilitado con la actividad económica correcta.',
      mandatory: true,
      renewal: 'unico',
      legalReference: 'Ley de Registro Único de Contribuyentes',
    },
    {
      code: 'regimen_tributario',
      area: 'sri',
      name: 'Régimen tributario (RIMPE / General)',
      authority: 'SRI',
      description:
        'Definición y cumplimiento del régimen tributario aplicable al negocio.',
      mandatory: true,
      renewal: 'ninguno',
      legalReference: 'Ley de Régimen Tributario Interno',
    },
    {
      code: 'facturacion_electronica',
      area: 'sri',
      name: 'Facturación electrónica',
      authority: 'SRI',
      description:
        'Emisión de comprobantes electrónicos autorizados por el SRI.',
      mandatory: true,
      renewal: 'ninguno',
      legalReference: 'Resoluciones SRI de comprobantes electrónicos',
    },
    {
      code: 'declaraciones',
      area: 'sri',
      name: 'Declaraciones IVA y Renta',
      authority: 'SRI',
      description:
        'Declaraciones periódicas de IVA y declaración anual de Impuesto a la Renta.',
      mandatory: true,
      renewal: 'periodico',
      legalReference: 'Ley de Régimen Tributario Interno',
    },
    // --- Laboral / IESS (condicionales) ---
    {
      code: 'iess_afiliacion',
      area: 'laboral_iess',
      name: 'Afiliación de empleados al IESS',
      authority: 'IESS',
      description:
        'Afiliación obligatoria de todo el personal en relación de dependencia.',
      mandatory: true,
      renewal: 'periodico',
      legalReference: 'Ley de Seguridad Social',
      appliesWhen: [{ field: 'staff_count', gt: 0 }],
    },
    {
      code: 'riesgos_trabajo',
      area: 'laboral_iess',
      name: 'Registro de riesgos del trabajo',
      authority: 'IESS (Riesgos del Trabajo)',
      description:
        'Registro y prevención de riesgos laborales del personal.',
      mandatory: true,
      renewal: 'periodico',
      legalReference: 'Reglamento del Seguro General de Riesgos del Trabajo',
      appliesWhen: [{ field: 'staff_count', gt: 0 }],
    },
    {
      code: 'reglamento_sst',
      area: 'laboral_iess',
      name: 'Reglamento de Higiene y Seguridad (SST)',
      authority: 'Ministerio del Trabajo',
      description:
        'Reglamento interno de seguridad y salud, obligatorio desde 10 trabajadores.',
      mandatory: true,
      renewal: 'unico',
      legalReference: 'Código del Trabajo; normativa del MDT',
      appliesWhen: [{ field: 'staff_count', gte: 10 }],
    },
  ],
};
