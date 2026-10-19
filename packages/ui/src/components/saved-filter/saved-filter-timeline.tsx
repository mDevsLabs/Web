// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTimeline, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { SavedFilter, SavedFilterStatus, SavedFilterActivity, SavedFilterMetric, SavedFilterSettingsValues } from './types.js';
export interface SavedFilterTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly SavedFilterActivity[];
    emptyMessage?: string;
}
export function SavedFilterTimeline(props: SavedFilterTimelineProps) { return <DomainTimeline config={config} {...props}/>; }
