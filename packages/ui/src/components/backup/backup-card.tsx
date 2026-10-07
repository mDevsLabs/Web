// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainCard, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Backup, BackupStatus, BackupActivity, BackupMetric, BackupSettingsValues } from './types.js';
export interface BackupCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Backup;
}
export function BackupCard(props: BackupCardProps) { return <DomainCard config={config} {...props}/>; }
