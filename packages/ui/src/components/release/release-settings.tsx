// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Release, ReleaseStatus, ReleaseActivity, ReleaseMetric, ReleaseSettingsValues } from './types.js';
export interface ReleaseSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: ReleaseSettingsValues;
    onChange: (key: keyof ReleaseSettingsValues, value: boolean) => void;
}
export function ReleaseSettings({ onChange, ...props }: ReleaseSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof ReleaseSettingsValues, value)}/>; }
