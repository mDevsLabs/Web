// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Event, EventStatus, EventActivity, EventMetric, EventSettingsValues } from './types.js';
export interface EventFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Event>;
    onSubmit: (value: Omit<Event, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function EventForm({ onSubmit, ...props }: EventFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Event, 'id'>)}/>; }
