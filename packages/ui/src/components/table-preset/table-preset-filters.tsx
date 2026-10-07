// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainFilters, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { TablePreset, TablePresetStatus, TablePresetActivity, TablePresetMetric, TablePresetSettingsValues } from './types.js';
export interface TablePresetFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: TablePresetStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: TablePresetStatus | '') => void;
}
export function TablePresetFilters({ onStatusChange, ...props }: TablePresetFiltersProps) { return <DomainFilters config={config} {...props} onStatusChange={onStatusChange ? value => onStatusChange(value as TablePresetStatus | '') : undefined}/>; }
