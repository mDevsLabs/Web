// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Habit, HabitStatus, HabitActivity, HabitMetric, HabitSettingsValues } from './types.js';
export interface HabitListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Habit[];
    onSelect?: (item: Habit) => void;
    emptyMessage?: string;
}
export function HabitList({ onSelect, ...props }: HabitListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Habit) : undefined}/>; }
