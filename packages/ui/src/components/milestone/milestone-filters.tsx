// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainFilters, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Milestone, MilestoneStatus, MilestoneActivity, MilestoneMetric, MilestoneSettingsValues } from './types.js';
export interface MilestoneFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: MilestoneStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: MilestoneStatus | '') => void;
}
export function MilestoneFilters({ onStatusChange, ...props }: MilestoneFiltersProps) { return <DomainFilters config={config} {...props} onStatusChange={onStatusChange ? value => onStatusChange(value as MilestoneStatus | '') : undefined}/>; }
