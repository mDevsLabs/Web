// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Document, DocumentStatus, DocumentActivity, DocumentMetric, DocumentSettingsValues } from './types.js';
export interface DocumentFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Document>;
    onSubmit: (value: Omit<Document, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function DocumentForm({ onSubmit, ...props }: DocumentFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Document, 'id'>)}/>; }
