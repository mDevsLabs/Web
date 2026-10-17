// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { BuildJob, BuildJobStatus, BuildJobActivity, BuildJobMetric, BuildJobSettingsValues } from './types.js';
export interface BuildJobSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: BuildJobSettingsValues;
    onChange: (key: keyof BuildJobSettingsValues, value: boolean) => void;
}
export function BuildJobSettings({ onChange, ...props }: BuildJobSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof BuildJobSettingsValues, value)}/>; }
