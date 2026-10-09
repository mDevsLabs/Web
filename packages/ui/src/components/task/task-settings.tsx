// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Task, TaskStatus, TaskActivity, TaskMetric, TaskSettingsValues } from './types.js';
export interface TaskSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: TaskSettingsValues;
    onChange: (key: keyof TaskSettingsValues, value: boolean) => void;
}
export function TaskSettings({ onChange, ...props }: TaskSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof TaskSettingsValues, value)}/>; }
