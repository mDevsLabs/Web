// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainFilters, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { MediaAsset, MediaAssetStatus, MediaAssetActivity, MediaAssetMetric, MediaAssetSettingsValues } from './types.js';
export interface MediaAssetFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: MediaAssetStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: MediaAssetStatus | '') => void;
}
export function MediaAssetFilters({ onStatusChange, ...props }: MediaAssetFiltersProps) { return <DomainFilters config={config} {...props} onStatusChange={onStatusChange ? value => onStatusChange(value as MediaAssetStatus | '') : undefined}/>; }
