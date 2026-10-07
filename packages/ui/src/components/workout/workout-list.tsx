// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Workout, WorkoutStatus, WorkoutActivity, WorkoutMetric, WorkoutSettingsValues } from './types.js';
export interface WorkoutListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Workout[];
    onSelect?: (item: Workout) => void;
    emptyMessage?: string;
}
export function WorkoutList({ onSelect, ...props }: WorkoutListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Workout) : undefined}/>; }
