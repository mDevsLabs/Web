// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainFilters, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Workout, WorkoutStatus, WorkoutActivity, WorkoutMetric, WorkoutSettingsValues } from './types.js';
export interface WorkoutFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: WorkoutStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: WorkoutStatus | '') => void;
}
export function WorkoutFilters({ onStatusChange, ...props }: WorkoutFiltersProps) { return <DomainFilters config={config} {...props} onStatusChange={onStatusChange ? value => onStatusChange(value as WorkoutStatus | '') : undefined}/>; }
