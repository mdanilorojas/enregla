/**
 * Application configuration and feature flags
 */

/** Current UI version - v2 (production) */
export const UI_VERSION = 'v2' as const;

/** Whether running in development mode */
export const IS_DEV: boolean = import.meta.env.DEV;
