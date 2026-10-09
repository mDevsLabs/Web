// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTimeline, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Destination, DestinationStatus, DestinationActivity, DestinationMetric, DestinationSettingsValues } from './types.js';
export interface DestinationTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly DestinationActivity[];
    emptyMessage?: string;
}
export function DestinationTimeline(props: DestinationTimelineProps) { return <DomainTimeline config={config} {...props}/>; }
