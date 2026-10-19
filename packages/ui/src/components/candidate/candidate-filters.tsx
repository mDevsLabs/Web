// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainFilters, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Candidate, CandidateStatus, CandidateActivity, CandidateMetric, CandidateSettingsValues } from './types.js';
export interface CandidateFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: CandidateStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: CandidateStatus | '') => void;
}
export function CandidateFilters({ onStatusChange, ...props }: CandidateFiltersProps) { return <DomainFilters config={config} {...props} onStatusChange={onStatusChange ? value => onStatusChange(value as CandidateStatus | '') : undefined}/>; }
