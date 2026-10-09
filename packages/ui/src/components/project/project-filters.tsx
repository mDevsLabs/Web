// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainFilters, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Project, ProjectStatus, ProjectActivity, ProjectMetric, ProjectSettingsValues } from './types.js';
export interface ProjectFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: ProjectStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: ProjectStatus | '') => void;
}
export function ProjectFilters({ onStatusChange, ...props }: ProjectFiltersProps) { return <DomainFilters config={config} {...props} onStatusChange={onStatusChange ? value => onStatusChange(value as ProjectStatus | '') : undefined}/>; }
