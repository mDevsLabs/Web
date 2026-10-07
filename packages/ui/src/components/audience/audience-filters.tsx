// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainFilters, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Audience, AudienceStatus, AudienceActivity, AudienceMetric, AudienceSettingsValues } from './types.js';
export interface AudienceFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: AudienceStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: AudienceStatus | '') => void;
}
export function AudienceFilters({ onStatusChange, ...props }: AudienceFiltersProps) { return <DomainFilters config={config} {...props} onStatusChange={onStatusChange ? value => onStatusChange(value as AudienceStatus | '') : undefined}/>; }
