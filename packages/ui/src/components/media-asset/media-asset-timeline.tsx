// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTimeline, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { MediaAsset, MediaAssetStatus, MediaAssetActivity, MediaAssetMetric, MediaAssetSettingsValues } from './types.js';
export interface MediaAssetTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly MediaAssetActivity[];
    emptyMessage?: string;
}
export function MediaAssetTimeline(props: MediaAssetTimelineProps) { return <DomainTimeline config={config} {...props}/>; }
