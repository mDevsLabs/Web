// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Server, ServerStatus, ServerActivity, ServerMetric, ServerSettingsValues } from './types.js';
export interface ServerSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: ServerSettingsValues;
    onChange: (key: keyof ServerSettingsValues, value: boolean) => void;
}
export function ServerSettings({ onChange, ...props }: ServerSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof ServerSettingsValues, value)}/>; }
