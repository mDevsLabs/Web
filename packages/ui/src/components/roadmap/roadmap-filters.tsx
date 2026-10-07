// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainFilters, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Roadmap, RoadmapStatus, RoadmapActivity, RoadmapMetric, RoadmapSettingsValues } from './types.js';
export interface RoadmapFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: RoadmapStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: RoadmapStatus | '') => void;
}
export function RoadmapFilters({ onStatusChange, ...props }: RoadmapFiltersProps) { return <DomainFilters config={config} {...props} onStatusChange={onStatusChange ? value => onStatusChange(value as RoadmapStatus | '') : undefined}/>; }
