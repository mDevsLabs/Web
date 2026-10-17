// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { SavedFilter, SavedFilterStatus, SavedFilterActivity, SavedFilterMetric, SavedFilterSettingsValues } from './types.js';
export interface SavedFilterListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly SavedFilter[];
    onSelect?: (item: SavedFilter) => void;
    emptyMessage?: string;
}
export function SavedFilterList({ onSelect, ...props }: SavedFilterListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as SavedFilter) : undefined}/>; }
