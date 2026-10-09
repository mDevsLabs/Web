// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Candidate, CandidateStatus, CandidateActivity, CandidateMetric, CandidateSettingsValues } from './types.js';
export interface CandidateFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Candidate>;
    onSubmit: (value: Omit<Candidate, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function CandidateForm({ onSubmit, ...props }: CandidateFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Candidate, 'id'>)}/>; }
