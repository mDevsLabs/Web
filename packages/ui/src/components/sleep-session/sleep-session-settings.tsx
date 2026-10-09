// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { SleepSession, SleepSessionStatus, SleepSessionActivity, SleepSessionMetric, SleepSessionSettingsValues } from './types.js';
export interface SleepSessionSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: SleepSessionSettingsValues;
    onChange: (key: keyof SleepSessionSettingsValues, value: boolean) => void;
}
export function SleepSessionSettings({ onChange, ...props }: SleepSessionSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof SleepSessionSettingsValues, value)}/>; }
