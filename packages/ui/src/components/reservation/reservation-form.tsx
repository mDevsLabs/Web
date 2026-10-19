// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Reservation, ReservationStatus, ReservationActivity, ReservationMetric, ReservationSettingsValues } from './types.js';
export interface ReservationFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Reservation>;
    onSubmit: (value: Omit<Reservation, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function ReservationForm({ onSubmit, ...props }: ReservationFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Reservation, 'id'>)}/>; }
