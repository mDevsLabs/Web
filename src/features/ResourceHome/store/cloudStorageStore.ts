/**
 * mAI Cloud — Store Zustand
 * Gère l'état de la consommation de stockage et la liste des fichiers Cloud.
 */
import { create } from 'zustand';

import {
  type CloudFile,
  type CloudStorageStatus,
  cloudStorageService,
} from '@/services/cloudStorage';

// ─── State ────────────────────────────────────────────────────────────────────

interface CloudStorageState {
  // Données
  files: CloudFile[];
  storage: CloudStorageStatus | null;

  // État de chargement
  deletingId: string | null;
  error: string | null;
  loading: boolean;
  uploading: boolean;

  // Actions
  deleteFile: (id: string) => Promise<void>;
  fetchFiles: () => Promise<void>;
  fetchStorage: () => Promise<void>;
  refreshAll: () => Promise<void>;
  uploadFile: (file: File) => Promise<void>;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useCloudStorageStore = create<CloudStorageState>((set, get) => ({
  deletingId: null,
  error: null,
  files: [],
  loading: false,
  storage: null,
  uploading: false,

  // ── fetchStorage ──────────────────────────────────────────────────────────
  fetchStorage: async () => {
    set({ error: null, loading: true });
    try {
      const storage = await cloudStorageService.fetchStorage();
      set({ loading: false, storage });
    } catch (err: any) {
      set({ error: err?.message ?? 'Erreur de chargement du quota.', loading: false });
    }
  },

  // ── fetchFiles ────────────────────────────────────────────────────────────
  fetchFiles: async () => {
    set({ error: null, loading: true });
    try {
      const files = await cloudStorageService.fetchFiles();
      set({ files, loading: false });
    } catch (err: any) {
      set({ error: err?.message ?? 'Erreur de chargement des fichiers.', loading: false });
    }
  },

  // ── refreshAll ────────────────────────────────────────────────────────────
  // Charge quota + fichiers en parallèle (utilisé à l'ouverture de la page)
  refreshAll: async () => {
    set({ error: null, loading: true });
    try {
      const [storage, files] = await Promise.all([
        cloudStorageService.fetchStorage(),
        cloudStorageService.fetchFiles(),
      ]);
      set({ files, loading: false, storage });
    } catch (err: any) {
      set({ error: err?.message ?? 'Erreur de chargement.', loading: false });
    }
  },

  // ── uploadFile ────────────────────────────────────────────────────────────
  uploadFile: async (file: File) => {
    const { storage } = get();

    // Vérification côté client AVANT d'envoyer (évite un aller-retour inutile)
    if (storage) {
      if (storage.over_limit) {
        throw Object.assign(
          new Error(`Quota dépassé — supprimez des fichiers pour libérer de l'espace.`),
          { over_limit: true },
        );
      }
      if (storage.bytes_used + file.size > storage.bytes_limit) {
        const neededMB = Math.ceil(file.size / (1024 * 1024));
        const freeMB = Math.floor((storage.bytes_limit - storage.bytes_used) / (1024 * 1024));
        throw Object.assign(
          new Error(`Espace insuffisant — il reste ${freeMB} MB mais le fichier fait ${neededMB} MB.`),
          { over_limit: true },
        );
      }
    }

    set({ error: null, uploading: true });
    try {
      const result = await cloudStorageService.uploadFile(file);
      // Ajouter le fichier en tête de liste + mettre à jour le quota
      set((state) => ({
        files: [result.file, ...state.files],
        storage: result.storage,
        uploading: false,
      }));
    } catch (err: any) {
      set({ error: err?.message ?? "Erreur lors de l'upload.", uploading: false });
      throw err; // propager pour que le composant puisse afficher un toast
    }
  },

  // ── deleteFile ────────────────────────────────────────────────────────────
  deleteFile: async (id: string) => {
    set({ deletingId: id, error: null });
    try {
      await cloudStorageService.deleteFile(id);
      // Retirer de la liste locale + recalculer quota depuis le serveur
      set((state) => ({
        deletingId: null,
        files: state.files.filter((f) => f.id !== id),
      }));
      // Rafraîchir le quota réel depuis l'API
      const storage = await cloudStorageService.fetchStorage();
      set({ storage });
    } catch (err: any) {
      set({ deletingId: null, error: err?.message ?? 'Erreur lors de la suppression.' });
      throw err;
    }
  },
}));
