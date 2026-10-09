// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTimeline, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Audience, AudienceStatus, AudienceActivity, AudienceMetric, AudienceSettingsValues } from './types.js';
export interface AudienceTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly AudienceActivity[];
    emptyMessage?: string;
}
export function AudienceTimeline(props: AudienceTimelineProps) { return <DomainTimeline config={config} {...props}/>; }
