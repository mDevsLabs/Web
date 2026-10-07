// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainFilters, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Workspace, WorkspaceStatus, WorkspaceActivity, WorkspaceMetric, WorkspaceSettingsValues } from './types.js';
export interface WorkspaceFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: WorkspaceStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: WorkspaceStatus | '') => void;
}
export function WorkspaceFilters({ onStatusChange, ...props }: WorkspaceFiltersProps) { return <DomainFilters config={config} {...props} onStatusChange={onStatusChange ? value => onStatusChange(value as WorkspaceStatus | '') : undefined}/>; }
