// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Certificate, CertificateStatus, CertificateActivity, CertificateMetric, CertificateSettingsValues } from './types.js';
export interface CertificateFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Certificate>;
    onSubmit: (value: Omit<Certificate, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function CertificateForm({ onSubmit, ...props }: CertificateFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Certificate, 'id'>)}/>; }
