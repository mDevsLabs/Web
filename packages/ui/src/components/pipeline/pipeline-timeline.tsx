// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTimeline, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Pipeline, PipelineStatus, PipelineActivity, PipelineMetric, PipelineSettingsValues } from './types.js';
export interface PipelineTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly PipelineActivity[];
    emptyMessage?: string;
}
export function PipelineTimeline(props: PipelineTimelineProps) { return <DomainTimeline config={config} {...props}/>; }
