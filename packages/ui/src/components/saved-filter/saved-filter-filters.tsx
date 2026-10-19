// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainFilters, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { SavedFilter, SavedFilterStatus, SavedFilterActivity, SavedFilterMetric, SavedFilterSettingsValues } from './types.js';
export interface SavedFilterFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: SavedFilterStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: SavedFilterStatus | '') => void;
}
export function SavedFilterFilters({ onStatusChange, ...props }: SavedFilterFiltersProps) { return <DomainFilters config={config} {...props} onStatusChange={onStatusChange ? value => onStatusChange(value as SavedFilterStatus | '') : undefined}/>; }
