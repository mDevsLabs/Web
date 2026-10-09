// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Calendar, CalendarStatus, CalendarActivity, CalendarMetric, CalendarSettingsValues } from './types.js';
export interface CalendarFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Calendar>;
    onSubmit: (value: Omit<Calendar, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function CalendarForm({ onSubmit, ...props }: CalendarFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Calendar, 'id'>)}/>; }
