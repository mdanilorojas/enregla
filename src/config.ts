/**
 * Application configuration and feature flags
 *
 * Controls UI version (v1/v2) and design system switching.
 * Values come from Vite environment variables and localStorage.
 */

export type UIVersion = 'v1' | 'v2';
export type DesignSystem = 'professional' | 'energetic';

/** Current UI version - 'v1' (legacy) or 'v2' (shadcn migration) */
export const UI_VERSION: UIVersion =
  (import.meta.env.VITE_UI_VERSION || 'v1') as UIVersion;

/** Active design system theme - 'professional' (blue/trust) or 'energetic' (orange/urgent) */
export const DESIGN_SYSTEM: DesignSystem =
  (localStorage.getItem('design-system') || 'professional') as DesignSystem;

/** Whether running in development mode */
export const IS_DEV: boolean = import.meta.env.DEV;
