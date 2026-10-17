// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Folder, FolderStatus, FolderActivity, FolderMetric, FolderSettingsValues } from './types.js';
export interface FolderListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Folder[];
    onSelect?: (item: Folder) => void;
    emptyMessage?: string;
}
export function FolderList({ onSelect, ...props }: FolderListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Folder) : undefined}/>; }
