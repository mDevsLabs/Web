// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainEmptyState, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Backup, BackupStatus, BackupActivity, BackupMetric, BackupSettingsValues } from './types.js';
export interface BackupEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export function BackupEmptyState(props: BackupEmptyStateProps) { return <DomainEmptyState config={config} {...props}/>; }
