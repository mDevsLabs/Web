// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Prescription, PrescriptionStatus, PrescriptionActivity, PrescriptionMetric, PrescriptionSettingsValues } from './types.js';
export interface PrescriptionSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: PrescriptionSettingsValues;
    onChange: (key: keyof PrescriptionSettingsValues, value: boolean) => void;
}
export function PrescriptionSettings({ onChange, ...props }: PrescriptionSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof PrescriptionSettingsValues, value)}/>; }
