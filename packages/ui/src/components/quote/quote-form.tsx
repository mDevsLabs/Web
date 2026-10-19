// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Quote, QuoteStatus, QuoteActivity, QuoteMetric, QuoteSettingsValues } from './types.js';
export interface QuoteFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Quote>;
    onSubmit: (value: Omit<Quote, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function QuoteForm({ onSubmit, ...props }: QuoteFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Quote, 'id'>)}/>; }
