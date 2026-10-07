// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Backup, BackupStatus, BackupActivity, BackupMetric, BackupSettingsValues } from './types.js';
export interface BackupListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Backup[];
    onSelect?: (item: Backup) => void;
    emptyMessage?: string;
}
export function BackupList({ onSelect, ...props }: BackupListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Backup) : undefined}/>; }
