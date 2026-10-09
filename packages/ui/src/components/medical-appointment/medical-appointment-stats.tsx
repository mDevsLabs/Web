// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainStats, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { MedicalAppointment, MedicalAppointmentStatus, MedicalAppointmentActivity, MedicalAppointmentMetric, MedicalAppointmentSettingsValues } from './types.js';
export interface MedicalAppointmentStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly MedicalAppointmentMetric[];
}
export function MedicalAppointmentStats(props: MedicalAppointmentStatsProps) { return <DomainStats config={config} {...props}/>; }
