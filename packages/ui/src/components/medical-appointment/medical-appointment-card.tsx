// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainCard, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { MedicalAppointment, MedicalAppointmentStatus, MedicalAppointmentActivity, MedicalAppointmentMetric, MedicalAppointmentSettingsValues } from './types.js';
export interface MedicalAppointmentCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: MedicalAppointment;
}
export function MedicalAppointmentCard(props: MedicalAppointmentCardProps) { return <DomainCard config={config} {...props}/>; }
