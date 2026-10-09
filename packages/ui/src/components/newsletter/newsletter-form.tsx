// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Newsletter, NewsletterStatus, NewsletterActivity, NewsletterMetric, NewsletterSettingsValues } from './types.js';
export interface NewsletterFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Newsletter>;
    onSubmit: (value: Omit<Newsletter, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function NewsletterForm({ onSubmit, ...props }: NewsletterFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Newsletter, 'id'>)}/>; }
