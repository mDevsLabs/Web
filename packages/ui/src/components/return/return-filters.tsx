// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainFilters, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Return, ReturnStatus, ReturnActivity, ReturnMetric, ReturnSettingsValues } from './types.js';
export interface ReturnFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: ReturnStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: ReturnStatus | '') => void;
}
export function ReturnFilters({ onStatusChange, ...props }: ReturnFiltersProps) { return <DomainFilters config={config} {...props} onStatusChange={onStatusChange ? value => onStatusChange(value as ReturnStatus | '') : undefined}/>; }
