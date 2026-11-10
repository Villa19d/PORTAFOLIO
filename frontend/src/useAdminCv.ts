import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  deleteAdminCv,
  getAdminCv,
  saveAdminCv,
  type CvLang,
  type CvState,
  type CvUpsertInput,
} from './adminCvApi';

export const adminCvQueryKey = ['admin', 'cv'] as const;

export function useAdminCv() {
  return useQuery<CvState>({
    queryKey: adminCvQueryKey,
    queryFn: getAdminCv,
  });
}

export function useSaveAdminCv() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ lang, cvDocument }: { lang: CvLang; cvDocument: CvUpsertInput }) =>
      saveAdminCv(lang, cvDocument),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminCvQueryKey }),
  });
}

export function useDeleteAdminCv() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (lang: CvLang) => deleteAdminCv(lang),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminCvQueryKey }),
  });
}
