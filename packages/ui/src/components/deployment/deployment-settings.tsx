// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Deployment, DeploymentStatus, DeploymentActivity, DeploymentMetric, DeploymentSettingsValues } from './types.js';
export interface DeploymentSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: DeploymentSettingsValues;
    onChange: (key: keyof DeploymentSettingsValues, value: boolean) => void;
}
export function DeploymentSettings({ onChange, ...props }: DeploymentSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof DeploymentSettingsValues, value)}/>; }
