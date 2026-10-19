// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Quote, QuoteStatus, QuoteActivity, QuoteMetric, QuoteSettingsValues } from './types.js';
export interface QuoteListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Quote[];
    onSelect?: (item: Quote) => void;
    emptyMessage?: string;
}
export function QuoteList({ onSelect, ...props }: QuoteListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Quote) : undefined}/>; }
