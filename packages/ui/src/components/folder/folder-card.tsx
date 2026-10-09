// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainCard, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Folder, FolderStatus, FolderActivity, FolderMetric, FolderSettingsValues } from './types.js';
export interface FolderCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Folder;
}
export function FolderCard(props: FolderCardProps) { return <DomainCard config={config} {...props}/>; }
