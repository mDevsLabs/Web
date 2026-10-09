// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { TablePreset, TablePresetStatus, TablePresetActivity, TablePresetMetric, TablePresetSettingsValues } from './types.js';
export interface TablePresetListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly TablePreset[];
    onSelect?: (item: TablePreset) => void;
    emptyMessage?: string;
}
export function TablePresetList({ onSelect, ...props }: TablePresetListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as TablePreset) : undefined}/>; }
