// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Sprint, SprintStatus, SprintActivity, SprintMetric, SprintSettingsValues } from './types.js';
export interface SprintSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: SprintSettingsValues;
    onChange: (key: keyof SprintSettingsValues, value: boolean) => void;
}
export function SprintSettings({ onChange, ...props }: SprintSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof SprintSettingsValues, value)}/>; }
