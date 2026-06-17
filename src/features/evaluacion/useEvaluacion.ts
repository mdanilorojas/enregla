import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchBusinessTypes,
  fetchBusinessType,
  listEvaluations,
  getEvaluation,
  saveEvaluation,
  updateEvaluation,
  deleteEvaluation,
} from './api';
import type { Evaluation } from './types';

export function useBusinessTypes() {
  return useQuery({
    queryKey: ['evaluacion', 'business-types'],
    queryFn: fetchBusinessTypes,
    staleTime: 5 * 60 * 1000,
  });
}

export function useBusinessType(slug: string | undefined) {
  return useQuery({
    queryKey: ['evaluacion', 'business-type', slug],
    queryFn: () => fetchBusinessType(slug!),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
}

export function useEvaluations() {
  return useQuery({
    queryKey: ['evaluacion', 'list'],
    queryFn: listEvaluations,
  });
}

export function useEvaluation(id: string | undefined) {
  return useQuery({
    queryKey: ['evaluacion', 'item', id],
    queryFn: () => getEvaluation(id!),
    enabled: !!id,
  });
}

export function useSaveEvaluation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Evaluation, 'id' | 'createdAt'>) => saveEvaluation(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['evaluacion', 'list'] }),
  });
}

export function useUpdateEvaluation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Pick<Evaluation, 'prospect' | 'inputs'> }) =>
      updateEvaluation(id, patch),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['evaluacion', 'list'] });
      qc.invalidateQueries({ queryKey: ['evaluacion', 'item', vars.id] });
    },
  });
}

export function useDeleteEvaluation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteEvaluation(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['evaluacion', 'list'] }),
  });
}
