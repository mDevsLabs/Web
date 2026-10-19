// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Booking, BookingStatus, BookingActivity, BookingMetric, BookingSettingsValues } from './types.js';
export interface BookingFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Booking>;
    onSubmit: (value: Omit<Booking, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function BookingForm({ onSubmit, ...props }: BookingFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Booking, 'id'>)}/>; }
