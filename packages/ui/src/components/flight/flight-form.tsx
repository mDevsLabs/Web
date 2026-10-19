// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Flight, FlightStatus, FlightActivity, FlightMetric, FlightSettingsValues } from './types.js';
export interface FlightFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Flight>;
    onSubmit: (value: Omit<Flight, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function FlightForm({ onSubmit, ...props }: FlightFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Flight, 'id'>)}/>; }
