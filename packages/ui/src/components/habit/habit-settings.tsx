// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Habit, HabitStatus, HabitActivity, HabitMetric, HabitSettingsValues } from './types.js';
export interface HabitSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: HabitSettingsValues;
    onChange: (key: keyof HabitSettingsValues, value: boolean) => void;
}
export function HabitSettings({ onChange, ...props }: HabitSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof HabitSettingsValues, value)}/>; }
