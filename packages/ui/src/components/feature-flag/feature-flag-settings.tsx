// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { FeatureFlag, FeatureFlagStatus, FeatureFlagActivity, FeatureFlagMetric, FeatureFlagSettingsValues } from './types.js';
export interface FeatureFlagSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: FeatureFlagSettingsValues;
    onChange: (key: keyof FeatureFlagSettingsValues, value: boolean) => void;
}
export function FeatureFlagSettings({ onChange, ...props }: FeatureFlagSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof FeatureFlagSettingsValues, value)}/>; }
