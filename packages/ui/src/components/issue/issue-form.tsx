// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Issue, IssueStatus, IssueActivity, IssueMetric, IssueSettingsValues } from './types.js';
export interface IssueFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Issue>;
    onSubmit: (value: Omit<Issue, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function IssueForm({ onSubmit, ...props }: IssueFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Issue, 'id'>)}/>; }
