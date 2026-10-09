// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainStats, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { BuildJob, BuildJobStatus, BuildJobActivity, BuildJobMetric, BuildJobSettingsValues } from './types.js';
export interface BuildJobStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly BuildJobMetric[];
}
export function BuildJobStats(props: BuildJobStatsProps) { return <DomainStats config={config} {...props}/>; }
