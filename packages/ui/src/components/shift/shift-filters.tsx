// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainFilters, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Shift, ShiftStatus, ShiftActivity, ShiftMetric, ShiftSettingsValues } from './types.js';
export interface ShiftFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: ShiftStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: ShiftStatus | '') => void;
}
export function ShiftFilters({ onStatusChange, ...props }: ShiftFiltersProps) { return <DomainFilters config={config} {...props} onStatusChange={onStatusChange ? value => onStatusChange(value as ShiftStatus | '') : undefined}/>; }
