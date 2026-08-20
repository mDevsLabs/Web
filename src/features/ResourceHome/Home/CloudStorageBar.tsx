'use client';

import { Flexbox, Icon } from '@lobehub/ui';
import { Alert, Progress, Skeleton, Tooltip, Typography } from 'antd';
import { createStaticStyles, cssVar } from 'antd-style';
import { CloudUpload } from 'lucide-react';
import { memo, useEffect } from 'react';

import { useCloudStorageStore } from '../store/cloudStorageStore';

const { Text } = Typography;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = createStaticStyles(({ css }) => ({
  badge: css`
    display: inline-block;
    padding: 2px 8px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.4px;
    text-transform: uppercase;
    background: ${cssVar.colorFillTertiary};
    color: ${cssVar.colorTextSecondary};
  `,
  container: css`
    width: 100%;
    padding: 16px 20px;
    border: 1px solid ${cssVar.colorBorderSecondary};
    border-radius: ${cssVar.borderRadiusLG};
    background: ${cssVar.colorBgContainer};
  `,
  label: css`
    font-size: 12px;
    color: ${cssVar.colorTextTertiary};
  `,
  title: css`
    font-size: 14px;
    font-weight: 600;
    color: ${cssVar.colorText};
  `,
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function getProgressColor(percent: number, overLimit: boolean): string {
  if (overLimit || percent >= 100) return '#ef4444'; // rouge
  if (percent >= 90) return '#f97316';               // orange vif
  if (percent >= 70) return '#eab308';               // jaune
  return '#22c55e';                                  // vert
}

// ─── Composant ────────────────────────────────────────────────────────────────

const CloudStorageBar = memo(() => {
  const { error, loading, storage } = useCloudStorageStore((s) => ({
    error: s.error,
    loading: s.loading,
    storage: s.storage,
  }));

  // Charger les données de quota au montage du composant
  useEffect(() => {
    useCloudStorageStore.getState().fetchStorage();
  }, []);

  // ── Skeleton loading ──
  if (loading && !storage) {
    return (
      <div className={styles.container}>
        <Skeleton active paragraph={{ rows: 2 }} title={false} />
      </div>
    );
  }

  // ── Erreur ──
  if (error && !storage) return null;

  // ── Données disponibles ──
  const percent = storage?.percent_used ?? 0;
  const overLimit = storage?.over_limit ?? false;
  const color = getProgressColor(percent, overLimit);

  const usedLabel = storage ? formatBytes(storage.bytes_used) : '—';
  const limitLabel = storage ? formatBytes(storage.bytes_limit) : '—';
  const filesLabel = storage ? `${storage.files_count} fichier${storage.files_count !== 1 ? 's' : ''}` : '';
  const tier = storage?.tier ?? 'Free';

  return (
    <Flexbox className={styles.container} gap={10}>
      {/* Titre + badge tier */}
      <Flexbox align="center" gap={8} horizontal justify="space-between">
        <Flexbox align="center" gap={8} horizontal>
          <Icon icon={CloudUpload} size={16} style={{ color: cssVar.colorTextSecondary }} />
          <span className={styles.title}>mAI Cloud</span>
        </Flexbox>
        <Tooltip title={`Forfait ${tier}`}>
          <span className={styles.badge}>{tier}</span>
        </Tooltip>
      </Flexbox>

      {/* Bannière quota dépassé */}
      {overLimit && (
        <Alert
          banner
          message="Quota de stockage dépassé — supprimez des fichiers pour libérer de l'espace."
          showIcon
          type="error"
        />
      )}

      {/* Barre de progression */}
      <Progress
        percent={Math.min(100, Math.round(percent * 10) / 10)}
        showInfo={false}
        size="small"
        status={overLimit ? 'exception' : 'normal'}
        strokeColor={color}
        trailColor={cssVar.colorFillSecondary as string}
      />

      {/* Labels sous la barre */}
      <Flexbox horizontal justify="space-between">
        <Text className={styles.label}>
          <strong>{usedLabel}</strong>
          {' utilisés sur '}
          <strong>{limitLabel}</strong>
          {filesLabel ? ` • ${filesLabel}` : ''}
        </Text>
        <Text className={styles.label}>{Math.min(100, Math.round(percent * 10) / 10)} %</Text>
      </Flexbox>
    </Flexbox>
  );
});

CloudStorageBar.displayName = 'CloudStorageBar';

export default CloudStorageBar;
