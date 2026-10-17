// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Database, DatabaseStatus, DatabaseActivity, DatabaseMetric, DatabaseSettingsValues } from './types.js';
export interface DatabaseFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Database>;
    onSubmit: (value: Omit<Database, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function DatabaseForm({ onSubmit, ...props }: DatabaseFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Database, 'id'>)}/>; }
