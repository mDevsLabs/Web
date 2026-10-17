// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Incident, IncidentStatus, IncidentActivity, IncidentMetric, IncidentSettingsValues } from './types.js';
export interface IncidentFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Incident>;
    onSubmit: (value: Omit<Incident, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function IncidentForm({ onSubmit, ...props }: IncidentFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Incident, 'id'>)}/>; }
