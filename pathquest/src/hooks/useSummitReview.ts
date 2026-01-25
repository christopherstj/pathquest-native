/**
 * useSummitReview Hooks
 * 
 * Mutations for confirming/denying unconfirmed summits.
 * Includes optimistic updates for smooth UX.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiClient } from '@/src/lib/api/client';
import { endpoints } from '@pathquest/shared/api';
import type { UnconfirmedSummit } from '@pathquest/shared';

/**
 * Mutation to confirm a single summit
 */
export function useConfirmSummit() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (summitId: string) => {
      const client = getApiClient();
      return await endpoints.confirmSummit(client, summitId);
    },
    onMutate: async (summitId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['unconfirmedSummits'] });
      
      // Snapshot previous value
      const previousSummits = queryClient.getQueryData<UnconfirmedSummit[]>(['unconfirmedSummits']);
      
      // Optimistically remove the summit from the list
      queryClient.setQueryData<UnconfirmedSummit[]>(
        ['unconfirmedSummits'],
        (old) => old?.filter((s) => s.id !== summitId) ?? []
      );
      
      // Also update any limited queries
      queryClient.setQueriesData<UnconfirmedSummit[]>(
        { queryKey: ['unconfirmedSummits'] },
        (old) => old?.filter((s) => s.id !== summitId) ?? []
      );
      
      return { previousSummits };
    },
    onError: (_err, _summitId, context) => {
      // Rollback on error
      if (context?.previousSummits) {
        queryClient.setQueryData(['unconfirmedSummits'], context.previousSummits);
      }
    },
    onSettled: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['unconfirmedSummits'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['recentSummits'] });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['userJournal'] });
    },
  });
}

/**
 * Mutation to deny a single summit
 */
export function useDenySummit() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (summitId: string) => {
      const client = getApiClient();
      return await endpoints.denySummit(client, summitId);
    },
    onMutate: async (summitId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['unconfirmedSummits'] });
      
      // Snapshot previous value
      const previousSummits = queryClient.getQueryData<UnconfirmedSummit[]>(['unconfirmedSummits']);
      
      // Optimistically remove the summit from the list
      queryClient.setQueryData<UnconfirmedSummit[]>(
        ['unconfirmedSummits'],
        (old) => old?.filter((s) => s.id !== summitId) ?? []
      );
      
      // Also update any limited queries
      queryClient.setQueriesData<UnconfirmedSummit[]>(
        { queryKey: ['unconfirmedSummits'] },
        (old) => old?.filter((s) => s.id !== summitId) ?? []
      );
      
      return { previousSummits };
    },
    onError: (_err, _summitId, context) => {
      // Rollback on error
      if (context?.previousSummits) {
        queryClient.setQueryData(['unconfirmedSummits'], context.previousSummits);
      }
    },
    onSettled: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['unconfirmedSummits'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['recentSummits'] });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
  });
}

/**
 * Mutation to confirm all unconfirmed summits at once
 */
export function useConfirmAllSummits() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const client = getApiClient();
      return await endpoints.confirmAllSummits(client);
    },
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['unconfirmedSummits'] });
      
      // Snapshot previous value
      const previousSummits = queryClient.getQueryData<UnconfirmedSummit[]>(['unconfirmedSummits']);
      
      // Optimistically clear all summits
      queryClient.setQueryData<UnconfirmedSummit[]>(['unconfirmedSummits'], []);
      queryClient.setQueriesData<UnconfirmedSummit[]>(
        { queryKey: ['unconfirmedSummits'] },
        () => []
      );
      
      return { previousSummits };
    },
    onError: (_err, _vars, context) => {
      // Rollback on error
      if (context?.previousSummits) {
        queryClient.setQueryData(['unconfirmedSummits'], context.previousSummits);
      }
    },
    onSettled: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['unconfirmedSummits'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['recentSummits'] });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['userJournal'] });
    },
  });
}




