// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainOverview, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Folder, FolderStatus, FolderActivity, FolderMetric, FolderSettingsValues } from './types.js';
export interface FolderOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Folder[];
    metrics: readonly FolderMetric[];
}
export function FolderOverview(props: FolderOverviewProps) { return <DomainOverview config={config} {...props}/>; }
