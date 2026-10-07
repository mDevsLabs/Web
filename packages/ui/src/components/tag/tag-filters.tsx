// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainFilters, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Tag, TagStatus, TagActivity, TagMetric, TagSettingsValues } from './types.js';
export interface TagFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: TagStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: TagStatus | '') => void;
}
export function TagFilters({ onStatusChange, ...props }: TagFiltersProps) { return <DomainFilters config={config} {...props} onStatusChange={onStatusChange ? value => onStatusChange(value as TagStatus | '') : undefined}/>; }
