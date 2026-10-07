// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Candidate, CandidateStatus, CandidateActivity, CandidateMetric, CandidateSettingsValues } from './types.js';
export interface CandidateListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Candidate[];
    onSelect?: (item: Candidate) => void;
    emptyMessage?: string;
}
export function CandidateList({ onSelect, ...props }: CandidateListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Candidate) : undefined}/>; }
