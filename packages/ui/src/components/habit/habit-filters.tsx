// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainFilters, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Habit, HabitStatus, HabitActivity, HabitMetric, HabitSettingsValues } from './types.js';
export interface HabitFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: HabitStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: HabitStatus | '') => void;
}
export function HabitFilters({ onStatusChange, ...props }: HabitFiltersProps) { return <DomainFilters config={config} {...props} onStatusChange={onStatusChange ? value => onStatusChange(value as HabitStatus | '') : undefined}/>; }
