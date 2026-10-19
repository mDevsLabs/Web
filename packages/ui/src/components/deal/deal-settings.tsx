// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Deal, DealStatus, DealActivity, DealMetric, DealSettingsValues } from './types.js';
export interface DealSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: DealSettingsValues;
    onChange: (key: keyof DealSettingsValues, value: boolean) => void;
}
export function DealSettings({ onChange, ...props }: DealSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof DealSettingsValues, value)}/>; }
