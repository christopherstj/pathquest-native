/**
 * useOfflineQueueRetry Hook
 * 
 * Listens for connectivity changes and automatically retries pending submissions
 * when connectivity is restored. Shows toast notifications for retry progress.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useNetworkStatus } from './useNetworkStatus';
import { 
  useOfflineQueueStore, 
  type PendingSubmission,
  type TripReportData,
  type ManualSummitData,
} from '@/src/store';
import { useToast } from '@/src/store/toastStore';
import { getApiClient } from '@/src/lib/api/client';
import { endpoints } from '@pathquest/shared/api';
import { getQueryClient } from '@/src/lib/queryCache';

// Maximum retry attempts before giving up
const MAX_RETRY_ATTEMPTS = 3;

// Delay between retries (exponential backoff)
const getRetryDelay = (attempt: number): number => {
  return Math.min(1000 * Math.pow(2, attempt), 30000); // Max 30 seconds
};

/**
 * Submit a trip report to the API.
 */
async function submitTripReport(data: TripReportData): Promise<void> {
  const client = getApiClient();
  
  await endpoints.updateAscent(client, {
    id: data.ascentId,
    is_public: true,
    notes: data.notes || undefined,
    difficulty: data.difficulty ?? undefined,
    experience_rating: data.experience ?? undefined,
    condition_tags: data.conditionTags?.length ? data.conditionTags : undefined,
    custom_condition_tags: data.tags?.length ? data.tags : undefined,
  });
}

/**
 * Submit a manual summit to the API.
 */
async function submitManualSummit(data: ManualSummitData): Promise<void> {
  const client = getApiClient();
  const summitId = `${data.userId}-${data.peakId}-${data.summitDate}`;
  
  await endpoints.addManualPeakSummit(client, {
    id: summitId,
    user_id: data.userId,
    peak_id: data.peakId,
    activity_id: data.activityId || undefined,
    notes: data.notes || undefined,
    is_public: true,
    timestamp: data.summitDate,
    timezone: data.timezone,
    difficulty: data.difficulty || undefined,
    experience_rating: data.experience || undefined,
    condition_tags: data.conditionTags?.length ? data.conditionTags : undefined,
    custom_condition_tags: data.tags?.length ? data.tags : undefined,
  });
}

/**
 * Upload photos for a submission.
 * Returns the number of successfully uploaded photos.
 */
async function uploadPhotos(
  submission: PendingSubmission
): Promise<number> {
  if (submission.photos.length === 0) return 0;

  const client = getApiClient();
  let successCount = 0;

  // Get the summit ID based on submission type
  const summitId = submission.type === 'trip_report'
    ? (submission.data as TripReportData).ascentId
    : `${(submission.data as ManualSummitData).userId}-${(submission.data as ManualSummitData).peakId}-${(submission.data as ManualSummitData).summitDate}`;

  const summitType = submission.type === 'trip_report' ? 'activity' : 'manual';

  for (const photo of submission.photos) {
    try {
      // 1. Get signed upload URL
      const uploadResponse = await endpoints.getPhotoUploadUrl(client, {
        filename: photo.filename,
        contentType: 'image/jpeg',
        summitType,
        summitId,
      });

      // 2. Upload to GCS
      const response = await fetch(photo.uri);
      const blob = await response.blob();

      await fetch(uploadResponse.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'image/jpeg' },
        body: blob,
      });

      // 3. Complete upload
      await endpoints.completePhotoUpload(client, {
        photoId: uploadResponse.photoId,
        width: photo.width,
        height: photo.height,
      });

      successCount++;
    } catch (error) {
      console.error('[OfflineRetry] Photo upload failed:', error);
      // Continue with other photos
    }
  }

  return successCount;
}

/**
 * Process a single pending submission.
 * Returns true if successful, false otherwise.
 */
async function processSubmission(submission: PendingSubmission): Promise<boolean> {
  try {
    // Submit the main data
    if (submission.type === 'trip_report') {
      await submitTripReport(submission.data as TripReportData);
    } else {
      await submitManualSummit(submission.data as ManualSummitData);
    }

    // Upload photos (if any)
    if (submission.photos.length > 0) {
      await uploadPhotos(submission);
    }

    // Invalidate relevant queries
    const queryClient = getQueryClient();
    if (queryClient) {
      if (submission.type === 'trip_report') {
        const data = submission.data as TripReportData;
        queryClient.invalidateQueries({ queryKey: ['peakDetails'] });
        queryClient.invalidateQueries({ queryKey: ['userPeaks'] });
        queryClient.invalidateQueries({ queryKey: ['userJournal'] });
      } else {
        const data = submission.data as ManualSummitData;
        queryClient.invalidateQueries({ queryKey: ['peakDetails', data.peakId] });
        queryClient.invalidateQueries({ queryKey: ['recentSummits'] });
        queryClient.invalidateQueries({ queryKey: ['userProfile'] });
        queryClient.invalidateQueries({ queryKey: ['userPeaks'] });
        queryClient.invalidateQueries({ queryKey: ['userJournal'] });
      }
    }

    return true;
  } catch (error) {
    console.error('[OfflineRetry] Submission failed:', error);
    return false;
  }
}

/**
 * Hook that automatically retries pending submissions when connectivity is restored.
 * 
 * @example
 * // In your root layout or a top-level component
 * useOfflineQueueRetry();
 */
export function useOfflineQueueRetry(): void {
  const { isConnected, isInternetReachable, isLoading: networkLoading } = useNetworkStatus();
  const toast = useToast();
  
  const pendingSubmissions = useOfflineQueueStore((s) => s.pendingSubmissions);
  const isRetrying = useOfflineQueueStore((s) => s.isRetrying);
  const isInitialized = useOfflineQueueStore((s) => s.isInitialized);
  const setRetrying = useOfflineQueueStore((s) => s.setRetrying);
  const removeSubmission = useOfflineQueueStore((s) => s.removeSubmission);
  const updateSubmission = useOfflineQueueStore((s) => s.updateSubmission);
  const initialize = useOfflineQueueStore((s) => s.initialize);

  // Track previous connectivity state to detect restoration
  const wasOffline = useRef(false);

  // Initialize the queue store on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Process pending submissions
  const processQueue = useCallback(async () => {
    if (isRetrying || pendingSubmissions.length === 0) return;

    setRetrying(true);
    console.log('[OfflineRetry] Processing', pendingSubmissions.length, 'pending submissions');

    let successCount = 0;
    let failCount = 0;

    for (const submission of pendingSubmissions) {
      // Skip if max retries exceeded
      if (submission.retryCount >= MAX_RETRY_ATTEMPTS) {
        console.log('[OfflineRetry] Max retries exceeded for:', submission.id);
        failCount++;
        continue;
      }

      // Add delay between retries (exponential backoff)
      if (submission.retryCount > 0) {
        const delay = getRetryDelay(submission.retryCount);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      const success = await processSubmission(submission);

      if (success) {
        await removeSubmission(submission.id);
        successCount++;
      } else {
        // Update retry count
        await updateSubmission(submission.id, {
          retryCount: submission.retryCount + 1,
          lastError: 'Submission failed',
        });
        failCount++;
      }
    }

    setRetrying(false);

    // Show toast notification with results
    if (successCount > 0 && failCount === 0) {
      toast.success(
        `${successCount} pending ${successCount === 1 ? 'submission' : 'submissions'} uploaded successfully.`,
        'Sync Complete'
      );
    } else if (successCount > 0 && failCount > 0) {
      toast.warning(
        `${successCount} uploaded, ${failCount} failed. Will retry later.`,
        'Partial Sync'
      );
    } else if (failCount > 0) {
      toast.error(
        `${failCount} ${failCount === 1 ? 'submission' : 'submissions'} failed to upload. Will retry later.`,
        'Sync Failed'
      );
    }
  }, [isRetrying, pendingSubmissions, setRetrying, removeSubmission, updateSubmission, toast]);

  // Monitor connectivity and trigger retry when restored
  useEffect(() => {
    // Skip if not initialized or still loading network status
    if (!isInitialized || networkLoading) return;

    const isOnline = isConnected && isInternetReachable !== false;

    // Detect connectivity restoration
    if (wasOffline.current && isOnline && pendingSubmissions.length > 0) {
      console.log('[OfflineRetry] Connectivity restored, processing queue');
      toast.info(
        `Syncing ${pendingSubmissions.length} pending ${pendingSubmissions.length === 1 ? 'submission' : 'submissions'}...`,
        'Back Online'
      );
      processQueue();
    }

    // Update offline tracking
    wasOffline.current = !isOnline;
  }, [isConnected, isInternetReachable, networkLoading, isInitialized, pendingSubmissions.length, processQueue, toast]);
}

export default useOfflineQueueRetry;

