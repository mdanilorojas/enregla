import { create } from 'zustand';
import { addDays } from 'date-fns';
import type { Company, Location, Permit, Renewal, Document, Task, PermitType } from '@/types';
import {
  mockCompany,
  mockLocations,
  mockPermits,
  mockRenewals,
  mockDocuments,
  mockTasks,
} from '@/data/mock';

interface AppState {
  isAuthenticated: boolean;
  isOnboarded: boolean;
  company: Company | null;
  locations: Location[];
  permits: Permit[];
  renewals: Renewal[];
  documents: Document[];
  tasks: Task[];

  login: () => void;
  logout: () => void;
  setOnboarded: (value: boolean) => void;
  setCompany: (company: Company) => void;
  setLocations: (locations: Location[]) => void;
  addLocation: (location: Location) => void;
  setPermits: (permits: Permit[]) => void;
  addPermit: (permit: Permit) => void;
  updatePermitStatus: (id: string, status: Permit['status']) => void;
  setRenewals: (renewals: Renewal[]) => void;
  setDocuments: (documents: Document[]) => void;
  setTasks: (tasks: Task[]) => void;
  updateTaskStatus: (id: string, status: Task['status']) => void;

  resolvePermit: (permitId: string, fileName: string) => void;

  loadMockData: () => void;

  getLocationPermits: (locationId: string) => Permit[];
  getLocationTasks: (locationId: string) => Task[];
  getLocationDocuments: (locationId: string) => Document[];
  getLocationRenewals: (locationId: string) => Renewal[];
  getPermitDocuments: (permitId: string) => Document[];
}

export const useAppStore = create<AppState>((set, get) => ({
  isAuthenticated: false,
  isOnboarded: true,
  company: mockCompany,
  locations: mockLocations,
  permits: mockPermits,
  renewals: mockRenewals,
  documents: mockDocuments,
  tasks: mockTasks,

  login: () => set({ isAuthenticated: true }),
  logout: () => set({ isAuthenticated: false }),
  setOnboarded: (value) => set({ isOnboarded: value }),
  setCompany: (company) => set({ company }),
  setLocations: (locations) => set({ locations }),
  addLocation: (location) => set((s) => ({ locations: [...s.locations, location] })),
  setPermits: (permits) => set({ permits }),
  addPermit: (permit) => set((s) => ({ permits: [...s.permits, permit] })),
  updatePermitStatus: (id, status) =>
    set((s) => ({
      permits: s.permits.map((p) => (p.id === id ? { ...p, status } : p)),
    })),
  setRenewals: (renewals) => set({ renewals }),
  setDocuments: (documents) => set({ documents }),
  setTasks: (tasks) => set({ tasks }),
  updateTaskStatus: (id, status) =>
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, status } : t)),
    })),

  resolvePermit: (permitId, fileName) => {
    const state = get();
    const permit = state.permits.find((p) => p.id === permitId);
    if (!permit) return;

    const validityDays: Partial<Record<PermitType, number>> = {
      patente_municipal: 365,
      bomberos: 365,
      arcsa: 365,
    };

    const now = new Date();
    const days = validityDays[permit.type];
    const expiryDate = days ? addDays(now, days).toISOString() : undefined;

    const docId = `doc-upload-${Date.now()}`;

    set({
      permits: state.permits.map((p) =>
        p.id === permitId
          ? { ...p, status: 'vigente' as const, issuedDate: now.toISOString(), expiryDate, documentIds: [...p.documentIds, docId] }
          : p,
      ),
      documents: [
        ...state.documents,
        {
          id: docId,
          locationId: permit.locationId,
          permitId: permit.id,
          name: fileName,
          type: 'permiso_pdf' as const,
          uploadedAt: now.toISOString(),
          expiryDate,
          status: 'vigente' as const,
        },
      ],
      renewals: state.renewals.map((r) =>
        r.permitId === permitId && r.status !== 'completado'
          ? { ...r, status: 'completado' as const }
          : r,
      ),
    });
  },

  loadMockData: () =>
    set({
      isOnboarded: true,
      company: mockCompany,
      locations: mockLocations,
      permits: mockPermits,
      renewals: mockRenewals,
      documents: mockDocuments,
      tasks: mockTasks,
    }),

  getLocationPermits: (locationId) => get().permits.filter((p) => p.locationId === locationId),
  getLocationTasks: (locationId) => get().tasks.filter((t) => t.locationId === locationId),
  getLocationDocuments: (locationId) => get().documents.filter((d) => d.locationId === locationId),
  getLocationRenewals: (locationId) => get().renewals.filter((r) => r.locationId === locationId),
  getPermitDocuments: (permitId) => get().documents.filter((d) => d.permitId === permitId),
}));
