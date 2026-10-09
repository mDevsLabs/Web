// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainOverview, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { BuildJob, BuildJobStatus, BuildJobActivity, BuildJobMetric, BuildJobSettingsValues } from './types.js';
export interface BuildJobOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly BuildJob[];
    metrics: readonly BuildJobMetric[];
}
export function BuildJobOverview(props: BuildJobOverviewProps) { return <DomainOverview config={config} {...props}/>; }
