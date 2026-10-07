// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainFilters, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Quote, QuoteStatus, QuoteActivity, QuoteMetric, QuoteSettingsValues } from './types.js';
export interface QuoteFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: QuoteStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: QuoteStatus | '') => void;
}
export function QuoteFilters({ onStatusChange, ...props }: QuoteFiltersProps) { return <DomainFilters config={config} {...props} onStatusChange={onStatusChange ? value => onStatusChange(value as QuoteStatus | '') : undefined}/>; }
