'use client';

import { Flexbox, Icon } from '@lobehub/ui';
import { App, Button, Skeleton, Tooltip, Typography } from 'antd';
import { createStaticStyles, cssVar } from 'antd-style';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Download, FileText, Trash2, UploadCloud } from 'lucide-react';
import { memo, useRef } from 'react';

import type { CloudFile } from '@/services/cloudStorage';

import { useCloudStorageStore } from '../store/cloudStorageStore';
import SectionTitle from './SectionTitle';

dayjs.extend(relativeTime);

const { Text } = Typography;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = createStaticStyles(({ css }) => ({
  deleteBtn: css`
    opacity: 0;
    transition: opacity 0.15s ease;
  `,
  empty: css`
    padding: 32px 0;
    text-align: center;
    color: ${cssVar.colorTextQuaternary};
    font-size: 13px;
  `,
  fileItem: css`
    display: flex;
    align-items: center;
    gap: 12px;

    padding: 10px 12px;
    border: 1px solid ${cssVar.colorBorderSecondary};
    border-radius: ${cssVar.borderRadius};

    background: ${cssVar.colorBgContainer};

    transition: background 0.15s;

    &:hover {
      background: ${cssVar.colorFillQuaternary};

      .delete-btn {
        opacity: 1;
      }
    }
  `,
  filename: css`
    overflow: hidden;
    flex: 1;
    font-size: 13px;
    color: ${cssVar.colorText};
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  list: css`
    display: flex;
    flex-direction: column;
    gap: 6px;
  `,
  meta: css`
    font-size: 11px;
    color: ${cssVar.colorTextQuaternary};
    white-space: nowrap;
  `,
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function getFileIcon(mimeType: string) {
  // On retourne toujours FileText pour l'instant — extensible
  void mimeType;
  return FileText;
}

// ─── FileRow ──────────────────────────────────────────────────────────────────

interface FileRowProps {
  file: CloudFile;
  isDeleting: boolean;
  onDelete: (id: string) => void;
}

const FileRow = memo(({ file, isDeleting, onDelete }: FileRowProps) => {
  const timeAgo = dayjs(file.uploaded_at).fromNow();

  return (
    <div className={styles.fileItem}>
      <Icon icon={getFileIcon(file.mime_type)} size={18} style={{ color: cssVar.colorTextTertiary, flexShrink: 0 }} />

      {/* Nom du fichier */}
      <span className={styles.filename}>{file.original_name}</span>

      {/* Méta : taille + date */}
      <Text className={styles.meta}>
        {formatBytes(file.size_bytes)} · {timeAgo}
      </Text>

      {/* Bouton télécharger */}
      <Tooltip title="Télécharger">
        <Button
          href={file.url}
          icon={<Icon icon={Download} size={14} />}
          rel="noopener noreferrer"
          size="small"
          target="_blank"
          type="text"
        />
      </Tooltip>

      {/* Bouton supprimer */}
      <Tooltip title="Supprimer définitivement">
        <Button
          className={`delete-btn ${styles.deleteBtn}`}
          danger
          icon={<Icon icon={Trash2} size={14} />}
          loading={isDeleting}
          size="small"
          type="text"
          onClick={() => onDelete(file.id)}
        />
      </Tooltip>
    </div>
  );
});

FileRow.displayName = 'FileRow';

// ─── CloudFileList ────────────────────────────────────────────────────────────

const CloudFileList = memo(() => {
  const { message } = App.useApp();
  const inputRef = useRef<HTMLInputElement>(null);

  const { deletingId, files, loading, storage, uploading } = useCloudStorageStore((s) => ({
    deletingId: s.deletingId,
    files: s.files,
    loading: s.loading,
    storage: s.storage,
    uploading: s.uploading,
  }));

  const { deleteFile, uploadFile } = useCloudStorageStore.getState();

  // ── Gestion de l'upload ───────────────────────────────────────────────────

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input pour permettre de re-sélectionner le même fichier
    e.target.value = '';

    try {
      await uploadFile(file);
      void message.success(`"${file.name}" uploadé avec succès ✅`);
    } catch (err: any) {
      if (err?.over_limit) {
        void message.error({ content: err.message, duration: 6 });
      } else {
        void message.error(err?.message ?? 'Erreur lors de l\'upload.');
      }
    }
  };

  const handleUploadClick = () => {
    // Bloquer immédiatement si le quota est dépassé (vérification locale)
    if (storage?.over_limit) {
      void message.error({ content: 'Quota dépassé — supprimez des fichiers pour libérer de l\'espace.', duration: 5 });
      return;
    }
    inputRef.current?.click();
  };

  // ── Gestion de la suppression ─────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    try {
      await deleteFile(id);
      void message.success('Fichier supprimé.');
    } catch (err: any) {
      void message.error(err?.message ?? 'Erreur lors de la suppression.');
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Flexbox gap={12}>
      {/* Titre + bouton upload */}
      <Flexbox align="center" horizontal justify="space-between">
        <SectionTitle title="Fichiers Cloud" />
        <Button
          disabled={storage?.over_limit}
          icon={<Icon icon={UploadCloud} size={14} />}
          loading={uploading}
          size="small"
          type="primary"
          onClick={handleUploadClick}
        >
          {uploading ? 'Upload…' : 'Importer'}
        </Button>
      </Flexbox>

      {/* Input fichier caché */}
      <input
        ref={inputRef}
        accept="*/*"
        style={{ display: 'none' }}
        type="file"
        onChange={handleFileChange}
      />

      {/* Contenu */}
      {loading && files.length === 0 ? (
        <div className={styles.list}>
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton active key={i} paragraph={{ rows: 1 }} title={false} />
          ))}
        </div>
      ) : files.length === 0 ? (
        <div className={styles.empty}>
          Aucun fichier Cloud — importez votre premier fichier 👆
        </div>
      ) : (
        <div className={styles.list}>
          {files.map((file) => (
            <FileRow
              file={file}
              isDeleting={deletingId === file.id}
              key={file.id}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </Flexbox>
  );
});

CloudFileList.displayName = 'CloudFileList';

export default CloudFileList;
