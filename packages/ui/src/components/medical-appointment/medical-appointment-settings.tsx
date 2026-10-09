// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { MedicalAppointment, MedicalAppointmentStatus, MedicalAppointmentActivity, MedicalAppointmentMetric, MedicalAppointmentSettingsValues } from './types.js';
export interface MedicalAppointmentSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: MedicalAppointmentSettingsValues;
    onChange: (key: keyof MedicalAppointmentSettingsValues, value: boolean) => void;
}
export function MedicalAppointmentSettings({ onChange, ...props }: MedicalAppointmentSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof MedicalAppointmentSettingsValues, value)}/>; }
