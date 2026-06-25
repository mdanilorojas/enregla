// Tour real con spotlight sobre la UI: apunta a elementos [data-tour] del
// AppLayout. Solo desktop (el sidebar se oculta en móvil).
// ponytail: gating en localStorage. Si importa multi-device → flag en profiles.
const DONE_KEY = 'er_tour_done';

const STEPS = [
  {
    element: '[data-tour="sedes"]',
    popover: {
      title: 'Tus sedes',
      description: 'Acá registrás cada local y ves su estado de cumplimiento.',
    },
  },
  {
    element: '[data-tour="permisos"]',
    popover: {
      title: 'Permisos',
      description: 'Cargá cada permiso, subí sus documentos y controlá qué falta.',
    },
  },
  {
    element: '[data-tour="renovaciones"]',
    popover: {
      title: 'Renovaciones',
      description: 'La línea de tiempo de todo lo que está por vencer.',
    },
  },
  {
    element: '[data-tour="notifications"]',
    popover: {
      title: 'Alertas',
      description: 'Te avisamos acá antes de cada vencimiento.',
    },
  },
  {
    element: '[data-tour="settings"]',
    popover: {
      title: 'Configuración',
      description: 'Ajustes de tu cuenta. Desde acá podés volver a ver este recorrido.',
    },
  },
];

export function hasSeenTour(): boolean {
  return localStorage.getItem(DONE_KEY) === '1';
}

export async function startTour({ force = false }: { force?: boolean } = {}): Promise<void> {
  if (!force && hasSeenTour()) return;
  // Sidebar (targets del tour) solo visible en ≥lg. En móvil no corremos tour.
  if (!document.querySelector('[data-tour="sedes"]')) {
    localStorage.setItem(DONE_KEY, '1');
    return;
  }

  // Carga driver.js solo cuando el tour corre (fuera del bundle principal).
  const { driver } = await import('driver.js');
  await import('driver.js/dist/driver.css');

  const d = driver({
    showProgress: true,
    nextBtnText: 'Siguiente',
    prevBtnText: 'Atrás',
    doneBtnText: 'Listo',
    progressText: '{{current}} de {{total}}',
    steps: STEPS,
    onDestroyed: () => localStorage.setItem(DONE_KEY, '1'),
  });
  d.drive();
}
