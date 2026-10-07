// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Student, StudentStatus, StudentActivity, StudentMetric, StudentSettingsValues } from './types.js';
export interface StudentSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: StudentSettingsValues;
    onChange: (key: keyof StudentSettingsValues, value: boolean) => void;
}
export function StudentSettings({ onChange, ...props }: StudentSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof StudentSettingsValues, value)}/>; }
