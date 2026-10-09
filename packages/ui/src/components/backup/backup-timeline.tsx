// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTimeline, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Backup, BackupStatus, BackupActivity, BackupMetric, BackupSettingsValues } from './types.js';
export interface BackupTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly BackupActivity[];
    emptyMessage?: string;
}
export function BackupTimeline(props: BackupTimelineProps) { return <DomainTimeline config={config} {...props}/>; }
