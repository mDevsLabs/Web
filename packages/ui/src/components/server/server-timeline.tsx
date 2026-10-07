// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTimeline, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Server, ServerStatus, ServerActivity, ServerMetric, ServerSettingsValues } from './types.js';
export interface ServerTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly ServerActivity[];
    emptyMessage?: string;
}
export function ServerTimeline(props: ServerTimelineProps) { return <DomainTimeline config={config} {...props}/>; }
