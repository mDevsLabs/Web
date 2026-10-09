// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTimeline, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { MedicalAppointment, MedicalAppointmentStatus, MedicalAppointmentActivity, MedicalAppointmentMetric, MedicalAppointmentSettingsValues } from './types.js';
export interface MedicalAppointmentTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly MedicalAppointmentActivity[];
    emptyMessage?: string;
}
export function MedicalAppointmentTimeline(props: MedicalAppointmentTimelineProps) { return <DomainTimeline config={config} {...props}/>; }
