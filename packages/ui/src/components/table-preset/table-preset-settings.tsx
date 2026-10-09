// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { TablePreset, TablePresetStatus, TablePresetActivity, TablePresetMetric, TablePresetSettingsValues } from './types.js';
export interface TablePresetSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: TablePresetSettingsValues;
    onChange: (key: keyof TablePresetSettingsValues, value: boolean) => void;
}
export function TablePresetSettings({ onChange, ...props }: TablePresetSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof TablePresetSettingsValues, value)}/>; }
