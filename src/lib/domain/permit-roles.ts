export type BusinessRole =
  | 'empleado'
  | 'representante_legal'
  | 'contador'
  | 'tecnico_responsable';

export type RequiredRole =
  | 'anyone'
  | 'representante_legal'
  | 'contador'
  | 'tecnico_responsable';

export const BUSINESS_ROLE_LABELS: Record<BusinessRole, string> = {
  empleado: 'Empleado',
  representante_legal: 'Representante Legal',
  contador: 'Contador',
  tecnico_responsable: 'Técnico Responsable',
};

export const REQUIRED_ROLE_LABELS: Record<RequiredRole, string> = {
  anyone: 'Cualquier miembro',
  representante_legal: 'Representante Legal',
  contador: 'Contador',
  tecnico_responsable: 'Técnico Responsable',
};

export const REQUIRED_ROLE_SHORT: Record<RequiredRole, string> = {
  anyone: 'ALL',
  representante_legal: 'RL',
  contador: 'CT',
  tecnico_responsable: 'TR',
};

/** Devuelve true si el usuario con businessRole puede ejecutar un permit que requiere requiredRole. */
export function roleMatches(businessRole: BusinessRole, requiredRole: RequiredRole): boolean {
  if (requiredRole === 'anyone') return true;
  return (businessRole as string) === (requiredRole as string);
}
