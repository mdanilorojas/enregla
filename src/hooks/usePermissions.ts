import { useAuth } from './useAuth';

/**
 * Permission helper hook based on user role
 * - admin: full access including user management and public links
 * - operator: CRUD operations on permits, locations, documents
 * - viewer: read-only access, no action buttons
 */
export function usePermissions() {
  const { role } = useAuth();

  return {
    // Edit/Update permissions (operator + admin)
    canEdit: role === 'admin' || role === 'operator',

    // Delete permissions (admin only)
    canDelete: role === 'admin',

    // Generate public links (admin only)
    canGeneratePublicLink: role === 'admin',

    // View-only mode (viewer)
    canViewOnly: role === 'viewer',

    // Upload documents (operator + admin)
    canUpload: role === 'admin' || role === 'operator',

    // Renew permits (operator + admin)
    canRenew: role === 'admin' || role === 'operator',

    // Current role
    role,
  };
}
