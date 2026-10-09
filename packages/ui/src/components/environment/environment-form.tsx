// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Environment, EnvironmentStatus, EnvironmentActivity, EnvironmentMetric, EnvironmentSettingsValues } from './types.js';
export interface EnvironmentFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Environment>;
    onSubmit: (value: Omit<Environment, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function EnvironmentForm({ onSubmit, ...props }: EnvironmentFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Environment, 'id'>)}/>; }
