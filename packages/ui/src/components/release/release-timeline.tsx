// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTimeline, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Release, ReleaseStatus, ReleaseActivity, ReleaseMetric, ReleaseSettingsValues } from './types.js';
export interface ReleaseTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly ReleaseActivity[];
    emptyMessage?: string;
}
export function ReleaseTimeline(props: ReleaseTimelineProps) { return <DomainTimeline config={config} {...props}/>; }
