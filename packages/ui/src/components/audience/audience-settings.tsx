// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Audience, AudienceStatus, AudienceActivity, AudienceMetric, AudienceSettingsValues } from './types.js';
export interface AudienceSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: AudienceSettingsValues;
    onChange: (key: keyof AudienceSettingsValues, value: boolean) => void;
}
export function AudienceSettings({ onChange, ...props }: AudienceSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof AudienceSettingsValues, value)}/>; }
