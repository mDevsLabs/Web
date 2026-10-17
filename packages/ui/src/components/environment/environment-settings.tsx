// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Environment, EnvironmentStatus, EnvironmentActivity, EnvironmentMetric, EnvironmentSettingsValues } from './types.js';
export interface EnvironmentSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: EnvironmentSettingsValues;
    onChange: (key: keyof EnvironmentSettingsValues, value: boolean) => void;
}
export function EnvironmentSettings({ onChange, ...props }: EnvironmentSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof EnvironmentSettingsValues, value)}/>; }
