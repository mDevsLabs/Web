// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Shift, ShiftStatus, ShiftActivity, ShiftMetric, ShiftSettingsValues } from './types.js';
export interface ShiftSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: ShiftSettingsValues;
    onChange: (key: keyof ShiftSettingsValues, value: boolean) => void;
}
export function ShiftSettings({ onChange, ...props }: ShiftSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof ShiftSettingsValues, value)}/>; }
