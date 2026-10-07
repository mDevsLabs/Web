// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Course, CourseStatus, CourseActivity, CourseMetric, CourseSettingsValues } from './types.js';
export interface CourseSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: CourseSettingsValues;
    onChange: (key: keyof CourseSettingsValues, value: boolean) => void;
}
export function CourseSettings({ onChange, ...props }: CourseSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof CourseSettingsValues, value)}/>; }
