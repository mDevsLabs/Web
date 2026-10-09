// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainOverview, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Workout, WorkoutStatus, WorkoutActivity, WorkoutMetric, WorkoutSettingsValues } from './types.js';
export interface WorkoutOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Workout[];
    metrics: readonly WorkoutMetric[];
}
export function WorkoutOverview(props: WorkoutOverviewProps) { return <DomainOverview config={config} {...props}/>; }
