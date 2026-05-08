import type { LegalReference, PermitType } from '@/types';

export type LegalCategory =
  | 'funcionamiento'
  | 'sanitario'
  | 'ambiental'
  | 'laboral'
  | 'seguridad';

export const PERMIT_TO_CATEGORY: Record<PermitType, LegalCategory> = {
  ruc: 'funcionamiento',
  patente_municipal: 'funcionamiento',
  uso_suelo: 'funcionamiento',
  rotulacion: 'funcionamiento',
  bomberos: 'seguridad',
  arcsa: 'sanitario',
};

export interface CategoryMeta {
  slug: LegalCategory;
  label: string;
  iconName: 'Building2' | 'FileText' | 'Shield' | 'Users' | 'AlertTriangle';
  description: string;
}

export const CATEGORY_META: Record<LegalCategory, CategoryMeta> = {
  funcionamiento: {
    slug: 'funcionamiento',
    label: 'Funcionamiento',
    iconName: 'Building2',
    description: 'Tributarios, municipales y licencias de operación',
  },
  seguridad: {
    slug: 'seguridad',
    label: 'Seguridad',
    iconName: 'AlertTriangle',
    description: 'Prevención de incendios y emergencias',
  },
  sanitario: {
    slug: 'sanitario',
    label: 'Sanitario',
    iconName: 'FileText',
    description: 'Control sanitario de alimentos, medicamentos y salud',
  },
  ambiental: {
    slug: 'ambiental',
    label: 'Ambiental',
    iconName: 'Shield',
    description: 'Regulaciones del Ministerio del Ambiente',
  },
  laboral: {
    slug: 'laboral',
    label: 'Laboral',
    iconName: 'Users',
    description: 'Obligaciones con el Ministerio del Trabajo e IESS',
  },
};

export const CATEGORY_ORDER: LegalCategory[] = [
  'funcionamiento',
  'seguridad',
  'sanitario',
  'ambiental',
  'laboral',
];

export const LEGAL_REFERENCES: Record<PermitType, LegalReference> = {
  ruc: {
    permitType: 'ruc',
    description:
      'El Registro Único de Contribuyentes (RUC) es el número de identificación tributaria para personas naturales y jurídicas en Ecuador. Es requisito previo para toda actividad económica formal y para la obtención de otros permisos.',
    sources: [
      {
        name: 'Ley del Registro Único de Contribuyentes',
        shortName: 'Ley RUC',
        type: 'ley_organica',
        articles: 'Art. 1–3 (obligación de inscripción); Art. 9 (actualización de información)',
        url: 'https://www.sri.gob.ec',
        entity: 'Servicio de Rentas Internas (SRI)',
        scope: 'nacional',
      },
      {
        name: 'Ley Orgánica del Régimen Tributario Interno (LORTI)',
        shortName: 'LORTI',
        type: 'ley_organica',
        articles: 'Art. 96 (deberes formales del contribuyente)',
        url: 'https://www.sri.gob.ec/web/guest/lorti',
        entity: 'Servicio de Rentas Internas (SRI)',
        scope: 'nacional',
      },
      {
        name: 'Reglamento para la Aplicación de la Ley del RUC',
        shortName: 'Reglamento RUC',
        type: 'reglamento',
        articles: 'Art. 4 (plazo de inscripción: 30 días); Art. 14 (establecimientos)',
        url: 'https://www.sri.gob.ec',
        entity: 'Servicio de Rentas Internas (SRI)',
        scope: 'nacional',
      },
    ],
    frequencyBasis:
      'El RUC se obtiene una sola vez, pero debe actualizarse dentro de 30 días ante cambios (nueva sucursal, cambio de actividad, dirección, etc.). Art. 9 Ley RUC establece la obligación de actualización. Cada establecimiento/sucursal debe registrarse como establecimiento adicional en el RUC.',
    consequences: [
      'Multas tributarias por no inscripción o datos desactualizados (Art. 97 LORTI)',
      'Imposibilidad de facturar legalmente',
      'Bloqueo para obtener otros permisos municipales y sectoriales',
      'Clausura del establecimiento por incumplimiento tributario',
    ],
    requiredDocuments: [
      'Cédula de identidad del representante legal',
      'Certificado de votación vigente',
      'Documento que acredite dirección del establecimiento (planilla de servicio básico)',
      'Escritura de constitución (personas jurídicas)',
      'Nombramiento del representante legal inscrito en el Registro Mercantil',
    ],
    typicalProcess: [
      'Acceder al portal web del SRI o acudir a oficinas presenciales',
      'Completar formulario de inscripción con datos de la empresa',
      'Registrar cada establecimiento/sucursal como establecimiento adicional',
      'Obtener certificado de RUC impreso',
      'Solicitar autorización de comprobantes de venta',
    ],
    estimatedCost: 'Sin costo directo. Trámite gratuito en el SRI.',
    disclaimer:
      'La información sobre el RUC es de aplicación nacional. Los plazos y multas específicas pueden variar según régimen tributario.',
  },

  patente_municipal: {
    permitType: 'patente_municipal',
    description:
      'La patente municipal es un impuesto y permiso obligatorio para ejercer actividades económicas dentro de un cantón. En Quito, es administrada por el Municipio del Distrito Metropolitano de Quito (MDMQ) y debe renovarse anualmente.',
    sources: [
      {
        name: 'Código Orgánico de Organización Territorial, Autonomía y Descentralización (COOTAD)',
        shortName: 'COOTAD',
        type: 'ley_organica',
        articles:
          'Art. 546–551 (impuesto de patentes municipales: base imponible, tarifas, obligación de pago)',
        url: 'https://www.finanzas.gob.ec/wp-content/uploads/downloads/2012/09/CODIGO_ORGANIZACION_TERRITORIAL.pdf',
        entity: 'Gobiernos Autónomos Descentralizados (GAD)',
        scope: 'nacional',
      },
      {
        name: 'Ordenanza Metropolitana de Quito — Licencia Metropolitana Única de Actividades Económicas (LUAE)',
        shortName: 'Ordenanza LUAE Quito',
        type: 'ordenanza',
        articles:
          'Ordenanza No. 308 (integra patente, turismo, publicidad exterior, bomberos en un solo trámite)',
        url: 'https://www.quito.gob.ec',
        entity: 'Municipio del Distrito Metropolitano de Quito',
        scope: 'municipal',
      },
      {
        name: 'Código Orgánico Tributario',
        shortName: 'COT',
        type: 'ley_organica',
        articles: 'Art. 21 (intereses por mora); Art. 323–327 (sanciones por incumplimiento)',
        url: 'https://www.sri.gob.ec',
        entity: 'Estado ecuatoriano',
        scope: 'nacional',
      },
    ],
    frequencyBasis:
      'Renovación anual. Art. 547 del COOTAD establece el impuesto de patente como anual, calculado sobre el patrimonio del contribuyente. En Quito, se integra dentro de la LUAE (Ordenanza 308). El período fiscal generalmente va de enero a diciembre, con plazo de pago hasta marzo.',
    consequences: [
      'Multas e intereses por mora (Art. 21 Código Tributario)',
      'Imposibilidad de renovar otros permisos operativos',
      'Clausura del establecimiento por parte de la Agencia Metropolitana de Control',
      'Bloqueo para obtener la LUAE (en Quito, la patente es componente de la LUAE)',
    ],
    requiredDocuments: [
      'RUC actualizado',
      'Formulario de solicitud LUAE (en Quito)',
      'Declaración de impuesto a la renta del año anterior',
      'Copia de cédula del representante legal',
      'Certificado de uso de suelo compatible (si es primera vez)',
      'Permiso de bomberos vigente',
    ],
    typicalProcess: [
      'Verificar uso de suelo compatible para la dirección del local',
      'Acceder al portal de trámites del municipio (en Quito: tramites.quito.gob.ec)',
      'Llenar solicitud de LUAE o patente municipal',
      'Adjuntar documentación requerida',
      'Pagar la tasa correspondiente según patrimonio',
      'Esperar emisión de la licencia/patente',
    ],
    estimatedCost:
      'Variable según patrimonio del contribuyente. Rango típico para restaurantes: $50–$500 USD/año. Art. 548 COOTAD establece tarifa entre $10 y $25,000.',
    disclaimer:
      'Las ordenanzas municipales varían por cantón. Los valores y procesos descritos aplican principalmente a Quito. Validar con el GAD correspondiente en otras ciudades.',
  },

  bomberos: {
    permitType: 'bomberos',
    description:
      'El permiso de funcionamiento del Cuerpo de Bomberos certifica que un establecimiento cumple con normas de seguridad contra incendios, incluyendo extintores, señalización, salidas de emergencia y sistemas de detección.',
    sources: [
      {
        name: 'Ley de Defensa Contra Incendios',
        shortName: 'Ley de Defensa Contra Incendios',
        type: 'ley_organica',
        articles:
          'Art. 35 (inspección obligatoria); Art. 40 (tasas por servicios); Art. 41 (sanciones)',
        url: 'https://www.gob.ec/regulaciones/ley-defensa-contra-incendios',
        entity: 'Cuerpo de Bomberos (jurisdiccional)',
        scope: 'nacional',
      },
      {
        name: 'Reglamento de Prevención, Mitigación y Protección Contra Incendios',
        shortName: 'Reglamento Contra Incendios',
        type: 'reglamento',
        articles:
          'Art. 350 (permisos de funcionamiento); Art. 351 (requisitos por categoría de riesgo); Art. 352 (inspecciones)',
        url: 'https://www.gob.ec/ccbbch/tramites/permiso-funcionamiento',
        entity: 'Ministerio de Inclusión Económica y Social / Bomberos',
        scope: 'nacional',
      },
      {
        name: 'Norma INEN NTE 439 — Señalización de seguridad',
        shortName: 'NTE INEN 439',
        type: 'normativa',
        articles: 'Norma completa (señalización, colores, pictogramas de seguridad)',
        url: 'https://www.normalizacion.gob.ec',
        entity: 'Servicio Ecuatoriano de Normalización (INEN)',
        scope: 'nacional',
      },
    ],
    frequencyBasis:
      'Renovación anual. Art. 35 de la Ley de Defensa Contra Incendios establece que todo establecimiento debe contar con inspección anual. En la práctica, el permiso de bomberos se renueva cada año calendario. En Quito, se integra dentro de la LUAE.',
    consequences: [
      'Clausura temporal o definitiva del establecimiento (Art. 41 Ley de Defensa Contra Incendios)',
      'Multas que van desde 1 a 20 salarios básicos según la infracción',
      'Responsabilidad civil y penal en caso de siniestro sin permiso vigente',
      'Imposibilidad de renovar la LUAE o patente municipal',
    ],
    requiredDocuments: [
      'Solicitud de inspección dirigida al Cuerpo de Bomberos',
      'RUC del establecimiento',
      'Copia de cédula del representante legal',
      'Plano del local con ubicación de extintores y salidas de emergencia',
      'Certificado de mantenimiento de extintores vigente',
      'Comprobante de pago de tasa de inspección',
    ],
    typicalProcess: [
      'Solicitar inspección al Cuerpo de Bomberos de la jurisdicción',
      'Pagar tasa de inspección (varía según metros cuadrados y categoría)',
      'Recibir la visita del inspector de bomberos',
      'Cumplir observaciones si las hubiera (plazo habitual: 15–30 días)',
      'Recibir el certificado/permiso de funcionamiento',
    ],
    estimatedCost:
      'Variable por jurisdicción y tamaño del local. En Quito: $20–$100 USD para locales de riesgo bajo/moderado (restaurantes típicos). Locales grandes o con riesgo alto: $100–$500 USD.',
    disclaimer:
      'Los procedimientos, tasas y categorías de riesgo varían significativamente por jurisdicción (Cuerpo de Bomberos local). En Quito el trámite se integra en la LUAE. Validar siempre con el cuerpo de bomberos correspondiente.',
  },

  arcsa: {
    permitType: 'arcsa',
    description:
      'El permiso de funcionamiento de la Agencia Nacional de Regulación, Control y Vigilancia Sanitaria (ARCSA) es obligatorio para establecimientos que manejan alimentos, bebidas, productos de higiene, cosméticos o medicamentos. Autoriza la operación bajo control sanitario.',
    sources: [
      {
        name: 'Ley Orgánica de Salud',
        shortName: 'Ley Orgánica de Salud',
        type: 'ley_organica',
        articles:
          'Art. 129 (control sanitario de establecimientos); Art. 130 (autorización de funcionamiento); Art. 131 (cumplimiento de normas sanitarias)',
        url: 'https://wipolex.wipo.int/es/legislation/details/18941',
        entity: 'Ministerio de Salud Pública / ARCSA',
        scope: 'nacional',
      },
      {
        name: 'Reglamento Sustitutivo para Otorgar Permisos de Funcionamiento a Establecimientos Sujetos a Vigilancia y Control Sanitario',
        shortName: 'Reglamento ARCSA Permisos',
        type: 'reglamento',
        articles:
          'Art. 4 (clasificación de establecimientos); Art. 5 (requisitos); Art. 8 (vigencia y renovación); Art. 10 (inspecciones)',
        url: 'https://www.controlsanitario.gob.ec/wp-content/uploads/downloads/2015/04/A-4712-Reglamento-para-otorgar-Permisos-de-funcionamiento-de-Establecimientos.pdf',
        entity: 'ARCSA',
        scope: 'nacional',
      },
      {
        name: 'Resolución ARCSA-DE-067-2015-GGG — Normativa técnica sanitaria para restaurantes y servicios afines',
        shortName: 'Resolución ARCSA 067-2015',
        type: 'resolucion',
        articles:
          'Capítulo II (condiciones del establecimiento); Capítulo III (manipulación de alimentos); Capítulo IV (almacenamiento)',
        url: 'https://permisosfuncionamiento.controlsanitario.gob.ec/',
        entity: 'ARCSA',
        scope: 'nacional',
      },
    ],
    frequencyBasis:
      'Renovación anual. Art. 8 del Reglamento Sustitutivo establece vigencia de un año desde la fecha de emisión. La solicitud de renovación debe realizarse al menos 30 días antes del vencimiento. El trámite se realiza en línea a través del portal de ARCSA.',
    consequences: [
      'Clausura inmediata del establecimiento (Art. 131 Ley Orgánica de Salud)',
      'Multas de 1 a 10 salarios básicos unificados',
      'Decomiso de productos en caso de riesgo sanitario',
      'Responsabilidad penal si se generan daños a la salud pública',
      'Prohibición de operar hasta obtener el permiso',
    ],
    requiredDocuments: [
      'RUC del establecimiento',
      'Cédula y certificado de votación del representante legal',
      'Categorización del establecimiento (según clasificación ARCSA)',
      'Plano del establecimiento con distribución de áreas',
      'Certificados de salud del personal que manipula alimentos',
      'Programa de control de plagas',
      'Certificado de capacitación en manipulación de alimentos',
    ],
    typicalProcess: [
      'Registrarse en el portal de ARCSA (permisosfuncionamiento.controlsanitario.gob.ec)',
      'Seleccionar categoría del establecimiento',
      'Cargar documentación requerida',
      'Pagar tasa correspondiente en línea',
      'Esperar revisión documental (y posible inspección para categorías de riesgo alto)',
      'Descargar permiso de funcionamiento digital',
    ],
    estimatedCost:
      'Según categoría de riesgo: Riesgo bajo (Tipo C): ~$65.10 USD. Riesgo medio (Tipo B): ~$171.64 USD. Riesgo alto (Tipo A): ~$385.44 USD. Restaurantes típicos: Tipo B o C.',
    disclaimer:
      'Las categorías y costos de ARCSA se actualizan periódicamente. El portal oficial de ARCSA es la fuente más actualizada para tasas y clasificaciones.',
  },

  uso_suelo: {
    permitType: 'uso_suelo',
    description:
      'El Informe de Compatibilidad de Uso de Suelo (ICUS) verifica que la actividad económica que se desea realizar es compatible con la zonificación del predio. Es prerequisito para obtener la patente municipal y la LUAE.',
    sources: [
      {
        name: 'Código Orgánico de Organización Territorial, Autonomía y Descentralización (COOTAD)',
        shortName: 'COOTAD',
        type: 'ley_organica',
        articles: 'Art. 54 literal c) (competencia de GAD en uso de suelo); Art. 466 (planes de ordenamiento territorial)',
        url: 'https://www.finanzas.gob.ec/wp-content/uploads/downloads/2012/09/CODIGO_ORGANIZACION_TERRITORIAL.pdf',
        entity: 'Gobiernos Autónomos Descentralizados (GAD)',
        scope: 'nacional',
      },
      {
        name: 'Ley Orgánica de Ordenamiento Territorial, Uso y Gestión de Suelo (LOOTUGS)',
        shortName: 'LOOTUGS',
        type: 'ley_organica',
        articles:
          'Art. 73 (clasificación del suelo); Art. 91 (uso del suelo); Art. 92 (compatibilidad de uso)',
        url: 'https://www.habitatyvivienda.gob.ec',
        entity: 'Ministerio de Desarrollo Urbano y Vivienda',
        scope: 'nacional',
      },
      {
        name: 'Plan de Uso y Ocupación del Suelo (PUOS) — Quito',
        shortName: 'PUOS Quito',
        type: 'ordenanza',
        articles: 'Mapa de zonificación y tabla de compatibilidades por zona',
        url: 'https://www.quito.gob.ec',
        entity: 'Municipio del Distrito Metropolitano de Quito',
        scope: 'municipal',
      },
    ],
    frequencyBasis:
      'Trámite por evento: se obtiene al abrir un nuevo establecimiento o al cambiar de actividad económica. No tiene vencimiento fijo, pero puede requerirse nuevamente si cambia la normativa de zonificación o el uso del suelo del sector. En algunos cantones se solicita renovación periódica.',
    consequences: [
      'Negación de la LUAE o patente municipal',
      'Clausura del establecimiento por operación en zona no compatible',
      'Multas municipales por uso irregular del suelo',
      'Obligación de reubicar el negocio',
    ],
    requiredDocuments: [
      'Solicitud dirigida a la Administración Zonal correspondiente',
      'Copia del RUC',
      'Copia de la escritura del inmueble o contrato de arrendamiento',
      'Croquis de ubicación del predio',
      'Cédula del propietario del inmueble y del solicitante',
      'Pago de predio actualizado (impuesto predial)',
    ],
    typicalProcess: [
      'Consultar zonificación del predio en el PUOS (disponible en línea para Quito)',
      'Solicitar el ICUS en la Administración Zonal correspondiente',
      'Presentar documentación del inmueble y la actividad planificada',
      'Esperar resolución (plazo habitual: 5–15 días hábiles)',
      'Recibir informe de compatibilidad favorable o desfavorable',
    ],
    estimatedCost: 'Variable por municipio. En Quito: ~$5–$30 USD por trámite.',
    disclaimer:
      'La zonificación varía drásticamente entre barrios y cantones. Un uso compatible en La Mariscal puede no serlo en La Floresta. Siempre consultar el PUOS vigente del municipio.',
  },

  rotulacion: {
    permitType: 'rotulacion',
    description:
      'El permiso de publicidad exterior o rotulación autoriza la instalación de rótulos, letreros, toldos y cualquier elemento de publicidad visible desde el espacio público. En Quito se gestiona como componente de la LUAE.',
    sources: [
      {
        name: 'Ordenanza Metropolitana de Publicidad Exterior — Quito',
        shortName: 'Ordenanza Publicidad Exterior',
        type: 'ordenanza',
        articles:
          'Art. 4 (autorización obligatoria); Art. 8 (dimensiones y especificaciones); Art. 15 (sanciones)',
        url: 'https://www.quito.gob.ec',
        entity: 'Municipio del Distrito Metropolitano de Quito',
        scope: 'municipal',
      },
      {
        name: 'Ordenanza LUAE — Quito (No. 308)',
        shortName: 'Ordenanza LUAE',
        type: 'ordenanza',
        articles: 'Integra el componente de publicidad exterior dentro de la LUAE',
        url: 'https://www.quito.gob.ec',
        entity: 'Municipio del Distrito Metropolitano de Quito',
        scope: 'municipal',
      },
      {
        name: 'COOTAD — Competencias municipales',
        shortName: 'COOTAD',
        type: 'ley_organica',
        articles: 'Art. 54 literal o) (regulación de publicidad en el espacio público)',
        url: 'https://www.finanzas.gob.ec/wp-content/uploads/downloads/2012/09/CODIGO_ORGANIZACION_TERRITORIAL.pdf',
        entity: 'Estado ecuatoriano',
        scope: 'nacional',
      },
    ],
    frequencyBasis:
      'Trámite por evento: se solicita al instalar o modificar rotulación. No tiene vencimiento anual fijo, aunque en Quito se renueva como componente de la LUAE. Modificaciones de diseño, tamaño o ubicación requieren nueva autorización.',
    consequences: [
      'Retiro forzoso del rótulo o publicidad por la autoridad municipal',
      'Multas que varían según el tamaño y tipo de infracción',
      'Imposibilidad de incluir el componente de publicidad en la LUAE',
    ],
    requiredDocuments: [
      'Solicitud de autorización de publicidad exterior',
      'Diseño gráfico del rótulo con dimensiones exactas',
      'Fotografía de la fachada actual',
      'Croquis de ubicación del rótulo',
      'Autorización del propietario del inmueble (si es arrendado)',
    ],
    typicalProcess: [
      'Preparar diseño del rótulo según especificaciones municipales',
      'Incluir el componente de publicidad exterior en la solicitud LUAE (Quito)',
      'Presentar documentación gráfica y técnica',
      'Esperar aprobación de la Administración Zonal',
      'Instalar el rótulo según el diseño aprobado',
    ],
    estimatedCost:
      'En Quito: variable según metros cuadrados de publicidad. Rango típico para restaurantes: $20–$150 USD.',
    disclaimer:
      'Las normas de publicidad exterior varían significativamente entre municipios. En zonas patrimoniales (Centro Histórico de Quito, por ejemplo) aplican restricciones adicionales.',
  },
};

export function getLegalReference(permitType: PermitType): LegalReference | undefined {
  return LEGAL_REFERENCES[permitType];
}

export function getAllLegalReferences(): LegalReference[] {
  return Object.values(LEGAL_REFERENCES);
}
