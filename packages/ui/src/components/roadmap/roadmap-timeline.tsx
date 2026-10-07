// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTimeline, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Roadmap, RoadmapStatus, RoadmapActivity, RoadmapMetric, RoadmapSettingsValues } from './types.js';
export interface RoadmapTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly RoadmapActivity[];
    emptyMessage?: string;
}
export function RoadmapTimeline(props: RoadmapTimelineProps) { return <DomainTimeline config={config} {...props}/>; }
