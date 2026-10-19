// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainFilters, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { SleepSession, SleepSessionStatus, SleepSessionActivity, SleepSessionMetric, SleepSessionSettingsValues } from './types.js';
export interface SleepSessionFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: SleepSessionStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: SleepSessionStatus | '') => void;
}
export function SleepSessionFilters({ onStatusChange, ...props }: SleepSessionFiltersProps) { return <DomainFilters config={config} {...props} onStatusChange={onStatusChange ? value => onStatusChange(value as SleepSessionStatus | '') : undefined}/>; }
