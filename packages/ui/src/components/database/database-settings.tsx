// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Database, DatabaseStatus, DatabaseActivity, DatabaseMetric, DatabaseSettingsValues } from './types.js';
export interface DatabaseSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: DatabaseSettingsValues;
    onChange: (key: keyof DatabaseSettingsValues, value: boolean) => void;
}
export function DatabaseSettings({ onChange, ...props }: DatabaseSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof DatabaseSettingsValues, value)}/>; }
