// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainFilters, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Task, TaskStatus, TaskActivity, TaskMetric, TaskSettingsValues } from './types.js';
export interface TaskFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: TaskStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: TaskStatus | '') => void;
}
export function TaskFilters({ onStatusChange, ...props }: TaskFiltersProps) { return <DomainFilters config={config} {...props} onStatusChange={onStatusChange ? value => onStatusChange(value as TaskStatus | '') : undefined}/>; }
