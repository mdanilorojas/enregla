// Feature flags and configuration

export const UI_VERSION = import.meta.env.VITE_UI_VERSION || 'v1';

export const DESIGN_SYSTEM =
  (typeof window !== 'undefined' && localStorage.getItem('design-system')) ||
  'professional';

export const IS_DEV = import.meta.env.DEV;
