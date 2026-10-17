// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Monitor, MonitorStatus, MonitorActivity, MonitorMetric, MonitorSettingsValues } from './types.js';
export interface MonitorSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: MonitorSettingsValues;
    onChange: (key: keyof MonitorSettingsValues, value: boolean) => void;
}
export function MonitorSettings({ onChange, ...props }: MonitorSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof MonitorSettingsValues, value)}/>; }
