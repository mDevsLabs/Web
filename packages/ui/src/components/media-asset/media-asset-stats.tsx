// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainStats, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { MediaAsset, MediaAssetStatus, MediaAssetActivity, MediaAssetMetric, MediaAssetSettingsValues } from './types.js';
export interface MediaAssetStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly MediaAssetMetric[];
}
export function MediaAssetStats(props: MediaAssetStatsProps) { return <DomainStats config={config} {...props}/>; }
