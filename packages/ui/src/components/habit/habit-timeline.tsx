// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTimeline, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Habit, HabitStatus, HabitActivity, HabitMetric, HabitSettingsValues } from './types.js';
export interface HabitTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly HabitActivity[];
    emptyMessage?: string;
}
export function HabitTimeline(props: HabitTimelineProps) { return <DomainTimeline config={config} {...props}/>; }
