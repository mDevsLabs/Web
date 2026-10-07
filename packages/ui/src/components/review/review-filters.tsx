// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainFilters, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Review, ReviewStatus, ReviewActivity, ReviewMetric, ReviewSettingsValues } from './types.js';
export interface ReviewFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: ReviewStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: ReviewStatus | '') => void;
}
export function ReviewFilters({ onStatusChange, ...props }: ReviewFiltersProps) { return <DomainFilters config={config} {...props} onStatusChange={onStatusChange ? value => onStatusChange(value as ReviewStatus | '') : undefined}/>; }
