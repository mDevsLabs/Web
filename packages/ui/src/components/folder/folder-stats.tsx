// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainStats, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Folder, FolderStatus, FolderActivity, FolderMetric, FolderSettingsValues } from './types.js';
export interface FolderStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly FolderMetric[];
}
export function FolderStats(props: FolderStatsProps) { return <DomainStats config={config} {...props}/>; }
