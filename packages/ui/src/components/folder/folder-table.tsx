// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTable, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Folder, FolderStatus, FolderActivity, FolderMetric, FolderSettingsValues } from './types.js';
export interface FolderTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Folder[];
    emptyMessage?: string;
}
export function FolderTable(props: FolderTableProps) { return <DomainTable config={config} {...props}/>; }
