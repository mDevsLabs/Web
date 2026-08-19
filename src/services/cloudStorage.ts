/**
 * mAI Cloud Storage Service
 * Appelle les routes /cloud/* de l'API mAI (https://mai.val.run)
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CloudStorageStatus {
  tier: string;
  bytes_used: number;
  bytes_limit: number;
  files_count: number;
  percent_used: number;
  over_limit: boolean;
}

export interface CloudFile {
  id: string;
  filename: string;
  original_name: string;
  url: string;
  size_bytes: number;
  mime_type: string;
  uploaded_at: string;
}

export interface CloudUploadResult {
  success: boolean;
  file: CloudFile;
  storage: CloudStorageStatus;
  percent_used: number;
}

// ─── Helper auth ──────────────────────────────────────────────────────────────

function authHeaders(): HeadersInit {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('mai_token');
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

// ─── Service ──────────────────────────────────────────────────────────────────

class CloudStorageService {
  /**
   * GET https://mai.val.run/cloud/storage
   * Retourne la consommation actuelle de stockage de l'utilisateur.
   */
  fetchStorage = async (): Promise<CloudStorageStatus> => {
    const res = await fetch('https://mai.val.run/cloud/storage', {
      headers: authHeaders(),
      method: 'GET',
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error((body as any)?.error ?? `Erreur ${res.status}`);
    }

    return res.json() as Promise<CloudStorageStatus>;
  };

  /**
   * GET https://mai.val.run/cloud/files
   * Retourne la liste des fichiers Cloud de l'utilisateur.
   */
  fetchFiles = async (): Promise<CloudFile[]> => {
    const res = await fetch('https://mai.val.run/cloud/files', {
      headers: authHeaders(),
      method: 'GET',
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error((body as any)?.error ?? `Erreur ${res.status}`);
    }

    const data = (await res.json()) as { files: CloudFile[]; success: boolean };
    return data.files ?? [];
  };

  /**
   * POST https://mai.val.run/cloud/upload
   * Upload un fichier vers R2 et met à jour le quota.
   * Lève une erreur avec `over_limit: true` si quota dépassé (HTTP 413).
   */
  uploadFile = async (file: File): Promise<CloudUploadResult> => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('https://mai.val.run/cloud/upload', {
      body: formData,
      headers: authHeaders(),
      method: 'POST',
    });

    const body = (await res.json().catch(() => ({}))) as Record<string, any>;

    if (!res.ok) {
      const err: any = new Error(body?.error ?? `Erreur ${res.status}`);
      err.over_limit = body?.over_limit ?? false;
      err.bytes_used = body?.bytes_used;
      err.bytes_limit = body?.bytes_limit;
      throw err;
    }

    return body as CloudUploadResult;
  };

  /**
   * DELETE https://mai.val.run/cloud/files/:id
   * Supprime définitivement un fichier de R2 et de la base de données.
   */
  deleteFile = async (id: string): Promise<void> => {
    const res = await fetch(`https://mai.val.run/cloud/files/${id}`, {
      headers: authHeaders(),
      method: 'DELETE',
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error((body as any)?.error ?? `Erreur ${res.status}`);
    }
  };
}

export const cloudStorageService = new CloudStorageService();

