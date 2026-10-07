// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTimeline, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Team, TeamStatus, TeamActivity, TeamMetric, TeamSettingsValues } from './types.js';
export interface TeamTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly TeamActivity[];
    emptyMessage?: string;
}
export function TeamTimeline(props: TeamTimelineProps) { return <DomainTimeline config={config} {...props}/>; }
