// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainStats, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Candidate, CandidateStatus, CandidateActivity, CandidateMetric, CandidateSettingsValues } from './types.js';
export interface CandidateStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly CandidateMetric[];
}
export function CandidateStats(props: CandidateStatsProps) { return <DomainStats config={config} {...props}/>; }
