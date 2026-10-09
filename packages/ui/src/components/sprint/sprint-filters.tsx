// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainFilters, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Sprint, SprintStatus, SprintActivity, SprintMetric, SprintSettingsValues } from './types.js';
export interface SprintFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: SprintStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: SprintStatus | '') => void;
}
export function SprintFilters({ onStatusChange, ...props }: SprintFiltersProps) { return <DomainFilters config={config} {...props} onStatusChange={onStatusChange ? value => onStatusChange(value as SprintStatus | '') : undefined}/>; }
