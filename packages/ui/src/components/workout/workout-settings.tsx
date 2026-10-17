// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Workout, WorkoutStatus, WorkoutActivity, WorkoutMetric, WorkoutSettingsValues } from './types.js';
export interface WorkoutSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: WorkoutSettingsValues;
    onChange: (key: keyof WorkoutSettingsValues, value: boolean) => void;
}
export function WorkoutSettings({ onChange, ...props }: WorkoutSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof WorkoutSettingsValues, value)}/>; }
