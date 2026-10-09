// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { PullRequest, PullRequestStatus, PullRequestActivity, PullRequestMetric, PullRequestSettingsValues } from './types.js';
export interface PullRequestFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<PullRequest>;
    onSubmit: (value: Omit<PullRequest, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function PullRequestForm({ onSubmit, ...props }: PullRequestFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<PullRequest, 'id'>)}/>; }
