// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainStats, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Pipeline, PipelineStatus, PipelineActivity, PipelineMetric, PipelineSettingsValues } from './types.js';
export interface PipelineStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly PipelineMetric[];
}
export function PipelineStats(props: PipelineStatsProps) { return <DomainStats config={config} {...props}/>; }
