// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Organization, OrganizationStatus, OrganizationActivity, OrganizationMetric, OrganizationSettingsValues } from './types.js';
export interface OrganizationFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Organization>;
    onSubmit: (value: Omit<Organization, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function OrganizationForm({ onSubmit, ...props }: OrganizationFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Organization, 'id'>)}/>; }
