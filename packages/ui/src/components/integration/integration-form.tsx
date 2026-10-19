// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Integration, IntegrationStatus, IntegrationActivity, IntegrationMetric, IntegrationSettingsValues } from './types.js';
export interface IntegrationFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Integration>;
    onSubmit: (value: Omit<Integration, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function IntegrationForm({ onSubmit, ...props }: IntegrationFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Integration, 'id'>)}/>; }
