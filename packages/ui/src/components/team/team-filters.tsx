// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainFilters, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Team, TeamStatus, TeamActivity, TeamMetric, TeamSettingsValues } from './types.js';
export interface TeamFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: TeamStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: TeamStatus | '') => void;
}
export function TeamFilters({ onStatusChange, ...props }: TeamFiltersProps) { return <DomainFilters config={config} {...props} onStatusChange={onStatusChange ? value => onStatusChange(value as TeamStatus | '') : undefined}/>; }
