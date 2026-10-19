// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainFilters, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Pipeline, PipelineStatus, PipelineActivity, PipelineMetric, PipelineSettingsValues } from './types.js';
export interface PipelineFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: PipelineStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: PipelineStatus | '') => void;
}
export function PipelineFilters({ onStatusChange, ...props }: PipelineFiltersProps) { return <DomainFilters config={config} {...props} onStatusChange={onStatusChange ? value => onStatusChange(value as PipelineStatus | '') : undefined}/>; }
