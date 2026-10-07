// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { MedicalAppointment, MedicalAppointmentStatus, MedicalAppointmentActivity, MedicalAppointmentMetric, MedicalAppointmentSettingsValues } from './types.js';
export interface MedicalAppointmentFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<MedicalAppointment>;
    onSubmit: (value: Omit<MedicalAppointment, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function MedicalAppointmentForm({ onSubmit, ...props }: MedicalAppointmentFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<MedicalAppointment, 'id'>)}/>; }
