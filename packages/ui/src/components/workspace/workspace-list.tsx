// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Workspace, WorkspaceStatus, WorkspaceActivity, WorkspaceMetric, WorkspaceSettingsValues } from './types.js';
export interface WorkspaceListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Workspace[];
    onSelect?: (item: Workspace) => void;
    emptyMessage?: string;
}
export function WorkspaceList({ onSelect, ...props }: WorkspaceListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Workspace) : undefined}/>; }
