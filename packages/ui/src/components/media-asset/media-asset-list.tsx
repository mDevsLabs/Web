// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { MediaAsset, MediaAssetStatus, MediaAssetActivity, MediaAssetMetric, MediaAssetSettingsValues } from './types.js';
export interface MediaAssetListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly MediaAsset[];
    onSelect?: (item: MediaAsset) => void;
    emptyMessage?: string;
}
export function MediaAssetList({ onSelect, ...props }: MediaAssetListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as MediaAsset) : undefined}/>; }
