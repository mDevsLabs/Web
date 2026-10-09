// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTable, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Workspace, WorkspaceStatus, WorkspaceActivity, WorkspaceMetric, WorkspaceSettingsValues } from './types.js';
export interface WorkspaceTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Workspace[];
    emptyMessage?: string;
}
export function WorkspaceTable(props: WorkspaceTableProps) { return <DomainTable config={config} {...props}/>; }
