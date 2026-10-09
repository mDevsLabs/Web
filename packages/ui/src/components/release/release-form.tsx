// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Release, ReleaseStatus, ReleaseActivity, ReleaseMetric, ReleaseSettingsValues } from './types.js';
export interface ReleaseFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Release>;
    onSubmit: (value: Omit<Release, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function ReleaseForm({ onSubmit, ...props }: ReleaseFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Release, 'id'>)}/>; }
