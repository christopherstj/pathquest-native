/**
 * Add Report Store
 *
 * Manages the state of the Add Report modal, including:
 * - Modal visibility
 * - Current ascent being edited
 * - Photo upload progress
 * - Form state
 */

import { create } from "zustand";
import type { Difficulty, ExperienceRating, ConditionTag } from "@pathquest/shared/types";
import type { SummitType, SummitPhoto } from "@pathquest/shared/types";

export interface AddReportData {
  ascentId: string;
  peakId: string;
  peakName: string;
  timestamp: string;
  activityId?: string;
  summitType: SummitType;
  // Existing values (for editing)
  notes?: string;
  difficulty?: Difficulty;
  experienceRating?: ExperienceRating;
  conditionTags?: ConditionTag[];
  customTags?: string[];
}

export interface PhotoUploadProgress {
  photoId: string;
  progress: number; // 0-100
  status: "uploading" | "processing" | "complete" | "error";
  error?: string;
}

interface AddReportState {
  // Modal state
  isOpen: boolean;
  data: AddReportData | null;

  // Form state
  notes: string;
  difficulty: Difficulty | null;
  experienceRating: ExperienceRating | null;
  conditionTags: ConditionTag[];
  customTags: string[];
  isPublic: boolean;

  // Photos state
  photos: SummitPhoto[];
  uploadProgress: Map<string, PhotoUploadProgress>;
  isLoadingPhotos: boolean;

  // Submission state
  isSubmitting: boolean;

  // Actions
  openModal: (data: AddReportData) => void;
  closeModal: () => void;

  // Form actions
  setNotes: (notes: string) => void;
  setDifficulty: (difficulty: Difficulty | null) => void;
  setExperienceRating: (rating: ExperienceRating | null) => void;
  toggleConditionTag: (tag: ConditionTag) => void;
  addCustomTag: (tag: string) => void;
  removeCustomTag: (tag: string) => void;
  setIsPublic: (isPublic: boolean) => void;

  // Photo actions
  setPhotos: (photos: SummitPhoto[]) => void;
  addPhoto: (photo: SummitPhoto) => void;
  removePhoto: (photoId: string) => void;
  updatePhotoCaption: (photoId: string, caption: string | null) => void;
  setUploadProgress: (photoId: string, progress: PhotoUploadProgress) => void;
  clearUploadProgress: (photoId: string) => void;
  setIsLoadingPhotos: (loading: boolean) => void;

  // Submission actions
  setIsSubmitting: (submitting: boolean) => void;
  resetForm: () => void;
}

const initialFormState = {
  notes: "",
  difficulty: null as Difficulty | null,
  experienceRating: null as ExperienceRating | null,
  conditionTags: [] as ConditionTag[],
  customTags: [] as string[],
  isPublic: true,
  photos: [] as SummitPhoto[],
  uploadProgress: new Map<string, PhotoUploadProgress>(),
  isLoadingPhotos: false,
  isSubmitting: false,
};

export const useAddReportStore = create<AddReportState>((set, get) => ({
  // Initial state
  isOpen: false,
  data: null,
  ...initialFormState,

  // Modal actions
  openModal: (data) => {
    set({
      isOpen: true,
      data,
      // Pre-populate form with existing data
      notes: data.notes ?? "",
      difficulty: data.difficulty ?? null,
      experienceRating: data.experienceRating ?? null,
      conditionTags: data.conditionTags ?? [],
      customTags: data.customTags ?? [],
      isPublic: true,
      photos: [],
      uploadProgress: new Map(),
      isLoadingPhotos: false,
      isSubmitting: false,
    });
  },

  closeModal: () => {
    set({
      isOpen: false,
      data: null,
      ...initialFormState,
    });
  },

  // Form actions
  setNotes: (notes) => set({ notes }),

  setDifficulty: (difficulty) => set({ difficulty }),

  setExperienceRating: (experienceRating) => set({ experienceRating }),

  toggleConditionTag: (tag) => {
    const current = get().conditionTags;
    const isSelected = current.includes(tag);
    set({
      conditionTags: isSelected ? current.filter((t) => t !== tag) : [...current, tag],
    });
  },

  addCustomTag: (tag) => {
    const trimmed = tag.trim();
    if (!trimmed) return;
    const current = get().customTags;
    if (!current.includes(trimmed)) {
      set({ customTags: [...current, trimmed] });
    }
  },

  removeCustomTag: (tag) => {
    set({ customTags: get().customTags.filter((t) => t !== tag) });
  },

  setIsPublic: (isPublic) => set({ isPublic }),

  // Photo actions
  setPhotos: (photos) => set({ photos }),

  addPhoto: (photo) => {
    set({ photos: [...get().photos, photo] });
  },

  removePhoto: (photoId) => {
    set({ photos: get().photos.filter((p) => p.id !== photoId) });
  },

  updatePhotoCaption: (photoId, caption) => {
    set({
      photos: get().photos.map((p) => (p.id === photoId ? { ...p, caption } : p)),
    });
  },

  setUploadProgress: (photoId, progress) => {
    const newMap = new Map(get().uploadProgress);
    newMap.set(photoId, progress);
    set({ uploadProgress: newMap });
  },

  clearUploadProgress: (photoId) => {
    const newMap = new Map(get().uploadProgress);
    newMap.delete(photoId);
    set({ uploadProgress: newMap });
  },

  setIsLoadingPhotos: (isLoadingPhotos) => set({ isLoadingPhotos }),

  // Submission actions
  setIsSubmitting: (isSubmitting) => set({ isSubmitting }),

  resetForm: () => set(initialFormState),
}));

