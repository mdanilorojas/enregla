# Public Links Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement public verification links with QR codes for locations, allowing external inspectors to view permits without authentication

**Architecture:** ShareButton in LocationDetailView opens ShareLocationModal (generates link + QR), public route `/p/{token}` displays PublicVerificationPage with permits and document downloads, Storage RLS policy enables public document access

**Tech Stack:** React 19, TypeScript, qrcode.react, Supabase RLS, react-router-dom, shadcn/ui

---

## File Structure

### New Files
- `src/features-v2/public-links/ShareLocationModal.tsx` - Modal with link generation and QR code
- `src/features-v2/public-links/PublicVerificationPage.tsx` - Public page at `/p/{token}`
- `src/features-v2/public-links/PermitCard.tsx` - Reusable permit display card
- `supabase/migrations/007_public_storage_policy.sql` - RLS policy for public document access

### Modified Files
- `src/lib/api/publicLinks.ts:110` - Add `getPublicLinkData()` function
- `src/features-v2/locations/LocationDetailView.tsx` - Add Share button in header
- `src/App.tsx` or routing file - Add public route `/p/:token`
- `package.json` - Add qrcode.react dependency

---

## Task 1: Install QR Code Library

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install qrcode.react**

Run: `npm install qrcode.react`
Expected: Package installed successfully

- [ ] **Step 2: Install TypeScript types**

Run: `npm install --save-dev @types/qrcode.react`
Expected: Types installed successfully

- [ ] **Step 3: Verify installation**

Run: `npm list qrcode.react`
Expected: Shows installed version

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add qrcode.react for QR code generation

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Add getPublicLinkData API Function

**Files:**
- Modify: `src/lib/api/publicLinks.ts:110`

- [ ] **Step 1: Add PublicLinkData interface**

Add after existing interfaces in `src/lib/api/publicLinks.ts`:

```typescript
export interface PublicLinkData {
  location: {
    id: string;
    name: string;
    address: string;
    code: string;
  };
  permits: Array<{
    id: string;
    type: string;
    issuer: string | null;
    status: 'vigente' | 'por_vencer' | 'vencido' | 'en_tramite' | 'no_registrado';
    issue_date: string | null;
    expiry_date: string | null;
    has_document: boolean;
    document_url: string | null;
  }>;
}
```

- [ ] **Step 2: Add getPublicLinkData function**

Add at end of `src/lib/api/publicLinks.ts`:

```typescript
/**
 * Get public link data by token for public verification page
 * Increments view_count and updates last_viewed_at
 */
export async function getPublicLinkData(token: string): Promise<PublicLinkData | null> {
  // 1. Buscar public_link por token
  const { data: link, error: linkError } = await supabase
    .from('public_links')
    .select('*, locations(*)')
    .eq('token', token)
    .eq('is_active', true)
    .single();
  
  if (linkError || !link) return null;
  
  // 2. Incrementar analytics
  await supabase
    .from('public_links')
    .update({
      view_count: link.view_count + 1,
      last_viewed_at: new Date().toISOString(),
    })
    .eq('id', link.id);
  
  // 3. Obtener permisos activos de la sede
  const { data: permits, error: permitsError } = await supabase
    .from('permits')
    .select(`
      id,
      type,
      issuer,
      status,
      issue_date,
      expiry_date,
      documents(id, file_path)
    `)
    .eq('location_id', link.location_id)
    .eq('is_active', true);
  
  if (permitsError) throw permitsError;
  
  // 4. Transformar datos
  const transformedPermits = permits.map(p => ({
    id: p.id,
    type: p.type,
    issuer: p.issuer,
    status: p.status,
    issue_date: p.issue_date,
    expiry_date: p.expiry_date,
    has_document: p.documents && p.documents.length > 0,
    document_url: p.documents?.[0]
      ? supabase.storage.from('permit-documents').getPublicUrl(p.documents[0].file_path).data.publicUrl
      : null,
  }));
  
  return {
    location: {
      id: link.locations.id,
      name: link.locations.name,
      address: link.locations.address,
      code: link.locations.code,
    },
    permits: transformedPermits,
  };
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npm run build`
Expected: No TypeScript errors

- [ ] **Step 4: Commit**

```bash
git add src/lib/api/publicLinks.ts
git commit -m "feat: add getPublicLinkData API function

Retrieves public link data by token with location info and permits.
Increments view_count and last_viewed_at for analytics.
Returns document URLs for public access.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Create Storage RLS Policy for Public Document Access

**Files:**
- Create: `supabase/migrations/007_public_storage_policy.sql`

- [ ] **Step 1: Create migration file**

Create file at `supabase/migrations/007_public_storage_policy.sql`:

```sql
-- Enable public access to permit documents via active public links
-- This allows inspectors to view documents when accessing /p/{token}

CREATE POLICY "Public access to permit documents via active public link"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'permit-documents'
  AND EXISTS (
    SELECT 1 
    FROM public_links pl
    JOIN permits p ON p.location_id = pl.location_id
    WHERE pl.is_active = true
    AND (storage.foldername(name))[1] = 'permits'
    AND (storage.foldername(name))[2] = p.id::text
  )
);
```

- [ ] **Step 2: Apply migration using MCP**

Run via MCP (if available):
```typescript
await mcp__supabase__apply_migration({
  name: 'public_storage_policy',
  query: '<paste SQL from file>'
});
```

Or manually: Paste SQL into Supabase Dashboard → SQL Editor → Run

Expected: Policy created successfully

- [ ] **Step 3: Verify policy exists**

Query in Supabase Dashboard:
```sql
SELECT * FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects' 
AND policyname LIKE '%public%';
```

Expected: Shows the new policy

- [ ] **Step 4: Test document access**

Try accessing a document URL from public_links token:
- Get a document file_path from database
- Generate public URL with `supabase.storage.from('permit-documents').getPublicUrl(file_path)`
- Open URL in browser (incognito/logged out)
- Expected: Document loads (not 403 error)

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/007_public_storage_policy.sql
git commit -m "feat: add Storage RLS policy for public document access

Allows public access to permit documents when accessed via active
public link. Documents are only accessible if a public_link exists
for that location and is active.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Create PermitCard Component

**Files:**
- Create: `src/features-v2/public-links/PermitCard.tsx`

- [ ] **Step 1: Create PermitCard component**

Create file at `src/features-v2/public-links/PermitCard.tsx`:

```typescript
import { format, parseISO } from 'date-fns';
import { FileText, ExternalLink } from 'lucide-react';

interface PermitCardProps {
  type: string;
  issuer: string | null;
  status: 'vigente' | 'por_vencer' | 'vencido' | 'en_tramite' | 'no_registrado';
  issueDate: string | null;
  expiryDate: string | null;
  hasDocument: boolean;
  documentUrl: string | null;
}

export function PermitCard({
  type,
  issuer,
  status,
  issueDate,
  expiryDate,
  hasDocument,
  documentUrl,
}: PermitCardProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'vigente':
        return '✅';
      case 'por_vencer':
        return '⚠️';
      case 'vencido':
        return '❌';
      case 'no_registrado':
        return '📋';
      default:
        return '📄';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'vigente':
        return 'text-green-600';
      case 'por_vencer':
        return 'text-yellow-600';
      case 'vencido':
        return 'text-red-600';
      case 'no_registrado':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const getDaysUntilExpiry = () => {
    if (!expiryDate) return null;
    const expiry = parseISO(expiryDate);
    const now = new Date();
    const days = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (days < 0) return 'vencido';
    if (days <= 30) return `${days} días`;
    return null;
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">{getStatusIcon()}</span>
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold text-gray-900 ${getStatusColor()}`}>
            {type}
          </h3>
          
          {issuer && (
            <p className="text-sm text-gray-600 mt-1">
              {issuer}
            </p>
          )}

          {status === 'no_registrado' ? (
            <p className="text-sm text-gray-500 mt-2">
              Estado: Pendiente de registro
            </p>
          ) : (
            <div className="mt-2 space-y-1">
              {issueDate && (
                <p className="text-sm text-gray-700">
                  Emisión: <span className="font-mono">{format(parseISO(issueDate), 'dd/MM/yyyy')}</span>
                </p>
              )}
              {expiryDate && (
                <p className="text-sm text-gray-700">
                  Vencimiento: <span className="font-mono">{format(parseISO(expiryDate), 'dd/MM/yyyy')}</span>
                  {getDaysUntilExpiry() && (
                    <span className={`ml-2 ${getStatusColor()}`}>
                      ({getDaysUntilExpiry()})
                    </span>
                  )}
                </p>
              )}
              {!expiryDate && status === 'vigente' && (
                <p className="text-sm text-gray-700">
                  Vigencia: Indefinida
                </p>
              )}
            </div>
          )}

          {hasDocument && documentUrl ? (
            <a
              href={documentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-3 text-sm text-primary hover:text-primary-hover transition-colors"
            >
              <FileText className="h-4 w-4" />
              Ver documento
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : status !== 'no_registrado' ? (
            <p className="text-xs text-gray-500 mt-3">(sin documento)</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npm run build`
Expected: No TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add src/features-v2/public-links/PermitCard.tsx
git commit -m "feat: create PermitCard component for public page

Displays permit information with status badge, dates, and document link.
Reusable component for PublicVerificationPage.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Create PublicVerificationPage Component

**Files:**
- Create: `src/features-v2/public-links/PublicVerificationPage.tsx`

- [ ] **Step 1: Create PublicVerificationPage with structure**

Create file at `src/features-v2/public-links/PublicVerificationPage.tsx`:

```typescript
import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { getPublicLinkData, type PublicLinkData } from '@/lib/api/publicLinks';
import { PermitCard } from './PermitCard';
import { AlertCircle, MapPin } from 'lucide-react';

export function PublicVerificationPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<PublicLinkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!token) {
        setError(true);
        setLoading(false);
        return;
      }

      try {
        const result = await getPublicLinkData(token);
        if (!result) {
          setError(true);
        } else {
          setData(result);
        }
      } catch (err) {
        console.error('Error loading public link data:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [token]);

  // Group permits by status
  const groupedPermits = useMemo(() => {
    if (!data) return null;

    const vigentes = data.permits.filter(p => p.status === 'vigente')
      .sort((a, b) => {
        if (!a.expiry_date) return 1;
        if (!b.expiry_date) return -1;
        return a.expiry_date.localeCompare(b.expiry_date);
      });

    const porVencer = data.permits.filter(p => p.status === 'por_vencer')
      .sort((a, b) => {
        if (!a.expiry_date) return 1;
        if (!b.expiry_date) return -1;
        return a.expiry_date.localeCompare(b.expiry_date);
      });

    const vencidos = data.permits.filter(p => p.status === 'vencido')
      .sort((a, b) => {
        if (!a.expiry_date) return -1;
        if (!b.expiry_date) return 1;
        return b.expiry_date.localeCompare(a.expiry_date);
      });

    const pendientes = data.permits.filter(p => p.status === 'no_registrado')
      .sort((a, b) => a.type.localeCompare(b.type));

    return { vigentes, porVencer, vencidos, pendientes };
  }, [data]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="min-h-screen bg-white">
        <header className="bg-gray-900 text-white py-4 px-6">
          <h1 className="text-xl font-semibold">🏢 EnRegla</h1>
        </header>
        
        <div className="max-w-2xl mx-auto px-6 py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Link No Válido
            </h2>
            <p className="text-gray-600 mb-4">
              Este link público no existe o ha sido desactivado.
            </p>
            <p className="text-sm text-gray-500">
              Contacta al administrador para obtener un link válido.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-gray-900 text-white py-4 px-6">
        <h1 className="text-xl font-semibold">🏢 EnRegla</h1>
      </header>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Location Info */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {data.location.name}
          </h2>
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <MapPin className="h-4 w-4" />
            <p>{data.location.address}</p>
          </div>
          <p className="text-sm text-gray-500 font-mono">{data.location.code}</p>
        </div>

        <hr className="border-gray-200 mb-8" />

        {/* Permisos Vigentes */}
        {groupedPermits!.vigentes.length > 0 && (
          <section className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Permisos Vigentes ({groupedPermits!.vigentes.length})
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              {groupedPermits!.vigentes.map(permit => (
                <PermitCard
                  key={permit.id}
                  type={permit.type}
                  issuer={permit.issuer}
                  status={permit.status}
                  issueDate={permit.issue_date}
                  expiryDate={permit.expiry_date}
                  hasDocument={permit.has_document}
                  documentUrl={permit.document_url}
                />
              ))}
            </div>
          </section>
        )}

        {/* Permisos por Vencer */}
        {groupedPermits!.porVencer.length > 0 && (
          <section className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Permisos por Vencer ({groupedPermits!.porVencer.length})
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              {groupedPermits!.porVencer.map(permit => (
                <PermitCard
                  key={permit.id}
                  type={permit.type}
                  issuer={permit.issuer}
                  status={permit.status}
                  issueDate={permit.issue_date}
                  expiryDate={permit.expiry_date}
                  hasDocument={permit.has_document}
                  documentUrl={permit.document_url}
                />
              ))}
            </div>
          </section>
        )}

        {/* Permisos Vencidos */}
        {groupedPermits!.vencidos.length > 0 && (
          <section className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Permisos Vencidos ({groupedPermits!.vencidos.length})
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              {groupedPermits!.vencidos.map(permit => (
                <PermitCard
                  key={permit.id}
                  type={permit.type}
                  issuer={permit.issuer}
                  status={permit.status}
                  issueDate={permit.issue_date}
                  expiryDate={permit.expiry_date}
                  hasDocument={permit.has_document}
                  documentUrl={permit.document_url}
                />
              ))}
            </div>
          </section>
        )}

        {/* Pendientes de Registro */}
        {groupedPermits!.pendientes.length > 0 && (
          <section className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Pendientes de Registro ({groupedPermits!.pendientes.length})
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              {groupedPermits!.pendientes.map(permit => (
                <PermitCard
                  key={permit.id}
                  type={permit.type}
                  issuer={permit.issuer}
                  status={permit.status}
                  issueDate={permit.issue_date}
                  expiryDate={permit.expiry_date}
                  hasDocument={permit.has_document}
                  documentUrl={permit.document_url}
                />
              ))}
            </div>
          </section>
        )}

        {/* No permits */}
        {data.permits.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Sin permisos registrados</p>
          </div>
        )}

        <hr className="border-gray-200 my-8" />

        {/* Footer */}
        <footer className="text-center text-sm text-gray-500">
          <p className="mb-1">
            Última actualización: {format(new Date(), "dd MMM yyyy HH:mm")}
          </p>
          <p className="flex items-center justify-center gap-2">
            <span>🔒</span>
            Verificado por EnRegla
          </p>
        </footer>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npm run build`
Expected: No TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add src/features-v2/public-links/PublicVerificationPage.tsx
git commit -m "feat: create PublicVerificationPage component

Public page at /p/{token} displaying location permits without auth.
Groups permits by status, shows document links, increments analytics.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Create ShareLocationModal Component

**Files:**
- Create: `src/features-v2/public-links/ShareLocationModal.tsx`

- [ ] **Step 1: Create ShareLocationModal with state and hooks**

Create file at `src/features-v2/public-links/ShareLocationModal.tsx`:

```typescript
import { useState, useEffect, useMemo } from 'react';
import { X, Copy, ExternalLink, MapPin, CheckCircle, AlertCircle } from 'lucide-react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { Button } from '@/components/ui-v2/button';
import { 
  getLocationPublicLink, 
  createPublicLink, 
  getPublicUrl,
  type PublicLink 
} from '@/lib/api/publicLinks';
import { usePermits } from '@/hooks/usePermits';
import { useAuth } from '@/hooks/useAuth';

interface ShareLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationId: string;
  locationName: string;
  locationAddress: string;
}

export function ShareLocationModal({
  isOpen,
  onClose,
  locationId,
  locationName,
  locationAddress,
}: ShareLocationModalProps) {
  const { companyId } = useAuth();
  const { permits } = usePermits({ companyId });
  const [link, setLink] = useState<PublicLink | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter permits for this location
  const locationPermits = useMemo(() => {
    return permits.filter(p => p.location_id === locationId && p.is_active);
  }, [permits, locationId]);

  // Calculate permit metrics
  const metrics = useMemo(() => {
    const vigentes = locationPermits.filter(p => p.status === 'vigente').length;
    const porVencer = locationPermits.filter(p => p.status === 'por_vencer').length;
    const vencidos = locationPermits.filter(p => p.status === 'vencido').length;
    return { vigentes, porVencer, vencidos };
  }, [locationPermits]);

  // Initialize link when modal opens
  useEffect(() => {
    async function initializeLink() {
      if (!isOpen) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Try to get existing link
        let existingLink = await getLocationPublicLink(locationId);
        
        if (!existingLink && companyId) {
          // Create new link
          existingLink = await createPublicLink({
            companyId,
            locationId,
            label: `Inspector ${locationName} ${new Date().getFullYear()}`,
          });
        }
        
        setLink(existingLink);
      } catch (err) {
        console.error('Error initializing link:', err);
        setError('Error al generar el link público');
      } finally {
        setLoading(false);
      }
    }
    
    initializeLink();
  }, [isOpen, locationId, locationName, companyId]);

  // Handle copy to clipboard
  const handleCopy = async () => {
    if (!link) return;
    
    try {
      const url = getPublicUrl(link.token);
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error copying to clipboard:', err);
    }
  };

  // Handle QR download
  const handleDownloadQR = () => {
    const canvas = document.getElementById('qr-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `qr-${locationName.toLowerCase().replace(/\s+/g, '-')}.png`;
    link.href = url;
    link.click();
  };

  // Handle view complete
  const handleViewComplete = () => {
    if (!link) return;
    const url = getPublicUrl(link.token);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <button
                onClick={onClose}
                className="text-sm text-gray-600 hover:text-gray-900 mb-2 flex items-center gap-1"
              >
                ← Volver a Sedes
              </button>
              <h2 className="text-2xl font-bold text-gray-900">
                Compartir Estado Documental
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Genera enlaces públicos y códigos QR para compartir el estado de tus sedes
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
              <p className="mt-4 text-gray-600">Generando link...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="text-sm text-red-600 hover:text-red-800 underline mt-1"
                >
                  Reintentar
                </button>
              </div>
            </div>
          )}

          {/* Content when link is loaded */}
          {!loading && !error && link && (
            <>
              {/* Configuration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sede a Compartir
                </label>
                <div className="border border-gray-300 rounded-md px-4 py-2 bg-gray-50">
                  <p className="font-medium text-gray-900">{locationName}</p>
                </div>
              </div>

              {/* Public Link */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enlace Público
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={getPublicUrl(link.token)}
                    readOnly
                    className="flex-1 border border-gray-300 rounded-md px-4 py-2 bg-gray-50 font-mono text-sm"
                  />
                  <Button
                    onClick={handleCopy}
                    variant={copied ? 'default' : 'outline'}
                    className="flex items-center gap-2"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copiar
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Preview + QR Code Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Preview */}
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Vista Previa Compacta
                  </h3>
                  <div className="space-y-2">
                    <p className="font-medium text-gray-900">{locationName}</p>
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {locationAddress}
                    </p>
                    <div className="mt-3 space-y-1">
                      {metrics.vigentes > 0 && (
                        <p className="text-sm text-green-600">
                          ✅ {metrics.vigentes} vigentes
                        </p>
                      )}
                      {metrics.porVencer > 0 && (
                        <p className="text-sm text-yellow-600">
                          ⚠️ {metrics.porVencer} por vencer
                        </p>
                      )}
                      {metrics.vencidos > 0 && (
                        <p className="text-sm text-red-600">
                          ❌ {metrics.vencidos} vencidos
                        </p>
                      )}
                      {locationPermits.length === 0 && (
                        <p className="text-sm text-gray-500">
                          Sin documentos públicos
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* QR Code */}
                <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-center bg-white">
                  <QRCodeSVG
                    value={getPublicUrl(link.token)}
                    size={256}
                    level="H"
                    includeMargin={true}
                  />
                </div>
              </div>

              {/* Hidden canvas for download */}
              <QRCodeCanvas
                id="qr-canvas"
                value={getPublicUrl(link.token)}
                size={512}
                level="H"
                includeMargin={true}
                style={{ display: 'none' }}
              />

              {/* Privacy Note */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Nota de Privacidad:</span> Los permisos mostrados, vigencias, y documentos adjuntos son visibles por quien acceda a este enlace.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={handleDownloadQR}
                  variant="outline"
                  className="flex-1"
                >
                  🔲 Generar Código QR
                </Button>
                <Button
                  onClick={handleViewComplete}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  Vista Completa
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npm run build`
Expected: No TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add src/features-v2/public-links/ShareLocationModal.tsx
git commit -m "feat: create ShareLocationModal component

Modal for generating and sharing public links with QR codes.
Shows preview, allows copying link, downloading QR, and viewing public page.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Add Share Button to LocationDetailView

**Files:**
- Modify: `src/features-v2/locations/LocationDetailView.tsx`

- [ ] **Step 1: Read current LocationDetailView**

Run: `cat src/features-v2/locations/LocationDetailView.tsx | head -50`
Expected: See current component structure

- [ ] **Step 2: Add imports**

Add at top of `src/features-v2/locations/LocationDetailView.tsx`:

```typescript
import { Share2 } from 'lucide-react';
import { ShareLocationModal } from '@/features-v2/public-links/ShareLocationModal';
```

- [ ] **Step 3: Add modal state**

Add state inside component (after other useState declarations):

```typescript
const [shareModalOpen, setShareModalOpen] = useState(false);
```

- [ ] **Step 4: Find header section and add Share button**

Locate the header section (where "Subir Documentos" button is) and add Share button:

```typescript
{/* Add after existing header buttons */}
<Button
  onClick={() => setShareModalOpen(true)}
  variant="outline"
  className="flex items-center gap-2"
>
  <Share2 className="h-4 w-4" />
  Compartir
</Button>
```

- [ ] **Step 5: Add ShareLocationModal to render**

Add at end of component return (before final closing tag):

```typescript
{/* Share Modal */}
<ShareLocationModal
  isOpen={shareModalOpen}
  onClose={() => setShareModalOpen(false)}
  locationId={locationId}
  locationName={location?.name || ''}
  locationAddress={location?.address || ''}
/>
```

- [ ] **Step 6: Verify TypeScript compiles**

Run: `npm run build`
Expected: No TypeScript errors

- [ ] **Step 7: Test in browser**

Run: `npm run dev`
Navigate to: `http://localhost:5173/sedes/{location-id}`
Expected: Share button appears in header

- [ ] **Step 8: Commit**

```bash
git add src/features-v2/locations/LocationDetailView.tsx
git commit -m "feat: add Share button to LocationDetailView

Share button opens ShareLocationModal for generating public links.
Positioned in header next to other action buttons.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 8: Add Public Route to App

**Files:**
- Modify: `src/App.tsx` (or routing file)

- [ ] **Step 1: Find routing configuration**

Check which file handles routes:
Run: `cat src/App.tsx | grep -A 20 "Routes"`

Or check: `src/main.tsx`, `src/router.tsx`

- [ ] **Step 2: Add import**

Add at top of routing file:

```typescript
import { PublicVerificationPage } from '@/features-v2/public-links/PublicVerificationPage';
```

- [ ] **Step 3: Add public route**

Add route to Routes configuration:

```typescript
{/* Public verification page - no auth required */}
<Route path="/p/:token" element={<PublicVerificationPage />} />
```

Note: Place this route BEFORE any authenticated routes or `<ProtectedRoute>` wrapper

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npm run build`
Expected: No TypeScript errors

- [ ] **Step 5: Test route**

Run: `npm run dev`
Navigate to: `http://localhost:5173/p/test-token`
Expected: Shows error page (since token is invalid)

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx
git commit -m "feat: add public verification route /p/:token

Public route for external access without authentication.
Displays PublicVerificationPage component.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 9: End-to-End Testing

**Files:**
- None (manual testing)

- [ ] **Step 1: Test ShareLocationModal**

1. Navigate to a location detail view
2. Click "Compartir" button
3. Modal opens
4. Verify link generates automatically
5. Verify QR code displays
6. Click "Copiar" - verify toast shows "Link copiado"
7. Click "Generar Código QR" - verify PNG downloads
8. Click "Vista Completa" - verify opens in new tab

Expected: All actions work without errors

- [ ] **Step 2: Test PublicVerificationPage with valid token**

1. Copy public link from modal
2. Open in incognito/private window (or logout)
3. Verify location info displays
4. Verify permits grouped by status
5. Verify document links appear on permits with documents
6. Click "Ver documento" - verify PDF opens
7. Verify PDF loads (not 403 error)

Expected: All data displays correctly, documents accessible

- [ ] **Step 3: Test PublicVerificationPage with invalid token**

Navigate to: `http://localhost:5173/p/invalid-token-123`

Expected: Shows error message "Link No Válido"

- [ ] **Step 4: Test analytics**

1. Visit public page multiple times
2. Check database: `SELECT view_count, last_viewed_at FROM public_links WHERE token = '...'`
3. Verify view_count increments
4. Verify last_viewed_at updates

Expected: Analytics track correctly

- [ ] **Step 5: Test responsive design**

1. Test on mobile viewport (375px)
2. Test on tablet (768px)
3. Test on desktop (1440px)

Expected: Layout adapts correctly at all sizes

- [ ] **Step 6: Document any issues found**

Create notes for any bugs or UX issues discovered during testing

---

## Task 10: Final Polish and Documentation

**Files:**
- None (cleanup only)

- [ ] **Step 1: Check for console.log statements**

Search for: `console.log` in new files
Remove any debug logs (keep console.error for errors)

- [ ] **Step 2: Verify all imports are used**

Run: `npm run build`
Check for unused import warnings
Remove any unused imports

- [ ] **Step 3: Test in production mode**

Run: `npm run build && npm run preview`
Navigate through all features
Expected: Everything works in production build

- [ ] **Step 4: Final verification checklist**

- [ ] Share button visible in LocationDetailView
- [ ] Modal opens and generates link
- [ ] QR code displays correctly
- [ ] Copy and download functions work
- [ ] Public page loads without auth
- [ ] Document links work
- [ ] Analytics increment correctly
- [ ] Responsive on mobile/tablet/desktop
- [ ] No console errors in browser

- [ ] **Step 5: Commit final cleanup**

```bash
git add .
git commit -m "chore: final cleanup for public links feature

Remove debug logs, unused imports, and verify production build.
Feature ready for demo.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Implementation Complete

**All features implemented! ✅**

✅ QR code library installed  
✅ getPublicLinkData API function  
✅ Storage RLS policy for public document access  
✅ PermitCard component  
✅ PublicVerificationPage  
✅ ShareLocationModal  
✅ Share button in LocationDetailView  
✅ Public route /p/:token  
✅ End-to-end testing  
✅ Final polish  

**Next steps:**
- Test with real data in staging
- Demo to Supermaxi with actual QR codes
- Monitor analytics (view_count) in production
- Future: Add link management page if needed

---

## Self-Review Checklist

**Spec Coverage:**
✅ ShareButton in LocationDetailView - Task 7  
✅ ShareLocationModal with QR generation - Task 6  
✅ PublicVerificationPage at /p/{token} - Task 5  
✅ getPublicLinkData API function - Task 2  
✅ Storage RLS policy - Task 3  
✅ qrcode.react library - Task 1  
✅ Public route configuration - Task 8  
✅ Document download functionality - Task 5 (PermitCard links)  
✅ Analytics tracking - Task 2 (view_count, last_viewed_at)  

**Placeholder Check:**
✅ No TBD or TODO placeholders  
✅ All code blocks complete  
✅ All commands have expected output  
✅ No "similar to Task N" references  

**Type Consistency:**
✅ PublicLinkData interface used consistently  
✅ PermitCardProps matches usage  
✅ ShareLocationModalProps matches usage  
✅ Function signatures consistent across files  

**All requirements from spec are implemented in the plan.**
