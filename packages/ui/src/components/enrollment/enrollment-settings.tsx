// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Enrollment, EnrollmentStatus, EnrollmentActivity, EnrollmentMetric, EnrollmentSettingsValues } from './types.js';
export interface EnrollmentSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: EnrollmentSettingsValues;
    onChange: (key: keyof EnrollmentSettingsValues, value: boolean) => void;
}
export function EnrollmentSettings({ onChange, ...props }: EnrollmentSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof EnrollmentSettingsValues, value)}/>; }
