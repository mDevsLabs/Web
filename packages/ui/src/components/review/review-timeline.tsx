// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTimeline, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Review, ReviewStatus, ReviewActivity, ReviewMetric, ReviewSettingsValues } from './types.js';
export interface ReviewTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly ReviewActivity[];
    emptyMessage?: string;
}
export function ReviewTimeline(props: ReviewTimelineProps) { return <DomainTimeline config={config} {...props}/>; }
