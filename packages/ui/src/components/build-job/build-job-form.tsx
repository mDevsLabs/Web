// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { BuildJob, BuildJobStatus, BuildJobActivity, BuildJobMetric, BuildJobSettingsValues } from './types.js';
export interface BuildJobFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<BuildJob>;
    onSubmit: (value: Omit<BuildJob, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function BuildJobForm({ onSubmit, ...props }: BuildJobFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<BuildJob, 'id'>)}/>; }
