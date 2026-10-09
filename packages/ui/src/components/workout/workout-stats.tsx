// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainStats, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Workout, WorkoutStatus, WorkoutActivity, WorkoutMetric, WorkoutSettingsValues } from './types.js';
export interface WorkoutStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly WorkoutMetric[];
}
export function WorkoutStats(props: WorkoutStatsProps) { return <DomainStats config={config} {...props}/>; }
