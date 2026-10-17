// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { RouteDefinition, RouteDefinitionStatus, RouteDefinitionActivity, RouteDefinitionMetric, RouteDefinitionSettingsValues } from './types.js';
export interface RouteDefinitionSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: RouteDefinitionSettingsValues;
    onChange: (key: keyof RouteDefinitionSettingsValues, value: boolean) => void;
}
export function RouteDefinitionSettings({ onChange, ...props }: RouteDefinitionSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof RouteDefinitionSettingsValues, value)}/>; }
