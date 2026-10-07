// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Contact, ContactStatus, ContactActivity, ContactMetric, ContactSettingsValues } from './types.js';
export interface ContactFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Contact>;
    onSubmit: (value: Omit<Contact, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function ContactForm({ onSubmit, ...props }: ContactFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Contact, 'id'>)}/>; }
