// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { ApiEndpoint, ApiEndpointStatus, ApiEndpointActivity, ApiEndpointMetric, ApiEndpointSettingsValues } from './types.js';
export interface ApiEndpointSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: ApiEndpointSettingsValues;
    onChange: (key: keyof ApiEndpointSettingsValues, value: boolean) => void;
}
export function ApiEndpointSettings({ onChange, ...props }: ApiEndpointSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof ApiEndpointSettingsValues, value)}/>; }
