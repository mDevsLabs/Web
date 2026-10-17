// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Assignment, AssignmentStatus, AssignmentActivity, AssignmentMetric, AssignmentSettingsValues } from './types.js';
export interface AssignmentSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: AssignmentSettingsValues;
    onChange: (key: keyof AssignmentSettingsValues, value: boolean) => void;
}
export function AssignmentSettings({ onChange, ...props }: AssignmentSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof AssignmentSettingsValues, value)}/>; }
