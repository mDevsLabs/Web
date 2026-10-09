// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Repository, RepositoryStatus, RepositoryActivity, RepositoryMetric, RepositorySettingsValues } from './types.js';
export interface RepositoryFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Repository>;
    onSubmit: (value: Omit<Repository, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function RepositoryForm({ onSubmit, ...props }: RepositoryFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Repository, 'id'>)}/>; }
