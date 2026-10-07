// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainOverview, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Candidate, CandidateStatus, CandidateActivity, CandidateMetric, CandidateSettingsValues } from './types.js';
export interface CandidateOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Candidate[];
    metrics: readonly CandidateMetric[];
}
export function CandidateOverview(props: CandidateOverviewProps) { return <DomainOverview config={config} {...props}/>; }
