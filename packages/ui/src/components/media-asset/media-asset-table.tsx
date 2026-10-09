// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTable, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { MediaAsset, MediaAssetStatus, MediaAssetActivity, MediaAssetMetric, MediaAssetSettingsValues } from './types.js';
export interface MediaAssetTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly MediaAsset[];
    emptyMessage?: string;
}
export function MediaAssetTable(props: MediaAssetTableProps) { return <DomainTable config={config} {...props}/>; }
