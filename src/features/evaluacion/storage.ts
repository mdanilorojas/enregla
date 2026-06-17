import type { Evaluation } from './types';

// Persistencia de evaluaciones en localStorage.
// Fase actual: sin BD aplicada. Swap futuro a tabla Supabase `evaluations`
// cuando la migración esté aplicada (ver spec §3).

const KEY = 'enregla.evaluaciones.v1';

function readAll(): Evaluation[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Evaluation[]) : [];
  } catch {
    return [];
  }
}

function writeAll(items: Evaluation[]): void {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function listEvaluations(): Evaluation[] {
  return readAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getEvaluation(id: string): Evaluation | undefined {
  return readAll().find((e) => e.id === id);
}

export function saveEvaluation(
  data: Omit<Evaluation, 'id' | 'createdAt'>
): Evaluation {
  const evaluation: Evaluation = {
    ...data,
    id:
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `ev_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    createdAt: new Date().toISOString(),
  };
  writeAll([evaluation, ...readAll()]);
  return evaluation;
}

export function updateEvaluation(
  id: string,
  patch: Pick<Evaluation, 'prospect' | 'inputs'>
): Evaluation {
  const all = readAll();
  const idx = all.findIndex((e) => e.id === id);
  if (idx === -1) throw new Error('Evaluación no encontrada');
  const updated: Evaluation = { ...all[idx], ...patch };
  all[idx] = updated;
  writeAll(all);
  return updated;
}

export function deleteEvaluation(id: string): void {
  writeAll(readAll().filter((e) => e.id !== id));
}
