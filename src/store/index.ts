import { create } from 'zustand';
import type { Company, Location, Permit, Renewal, Document, Task } from '@/types';
import {
  mockCompany,
  mockLocations,
  mockPermits,
  mockRenewals,
  mockDocuments,
  mockTasks,
} from '@/data/mock';

interface AppState {
  isOnboarded: boolean;
  company: Company | null;
  locations: Location[];
  permits: Permit[];
  renewals: Renewal[];
  documents: Document[];
  tasks: Task[];

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

  loadMockData: () => void;

  getLocationPermits: (locationId: string) => Permit[];
  getLocationTasks: (locationId: string) => Task[];
  getLocationDocuments: (locationId: string) => Document[];
  getLocationRenewals: (locationId: string) => Renewal[];
  getPermitDocuments: (permitId: string) => Document[];
}

export const useAppStore = create<AppState>((set, get) => ({
  isOnboarded: true,
  company: mockCompany,
  locations: mockLocations,
  permits: mockPermits,
  renewals: mockRenewals,
  documents: mockDocuments,
  tasks: mockTasks,

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
