// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainFilters, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Assignment, AssignmentStatus, AssignmentActivity, AssignmentMetric, AssignmentSettingsValues } from './types.js';
export interface AssignmentFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: AssignmentStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: AssignmentStatus | '') => void;
}
export function AssignmentFilters({ onStatusChange, ...props }: AssignmentFiltersProps) { return <DomainFilters config={config} {...props} onStatusChange={onStatusChange ? value => onStatusChange(value as AssignmentStatus | '') : undefined}/>; }
