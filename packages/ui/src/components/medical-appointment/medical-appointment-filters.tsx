// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainFilters, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { MedicalAppointment, MedicalAppointmentStatus, MedicalAppointmentActivity, MedicalAppointmentMetric, MedicalAppointmentSettingsValues } from './types.js';
export interface MedicalAppointmentFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: MedicalAppointmentStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: MedicalAppointmentStatus | '') => void;
}
export function MedicalAppointmentFilters({ onStatusChange, ...props }: MedicalAppointmentFiltersProps) { return <DomainFilters config={config} {...props} onStatusChange={onStatusChange ? value => onStatusChange(value as MedicalAppointmentStatus | '') : undefined}/>; }
