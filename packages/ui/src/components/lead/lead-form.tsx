// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Lead, LeadStatus, LeadActivity, LeadMetric, LeadSettingsValues } from './types.js';
export interface LeadFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Lead>;
    onSubmit: (value: Omit<Lead, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function LeadForm({ onSubmit, ...props }: LeadFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Lead, 'id'>)}/>; }
