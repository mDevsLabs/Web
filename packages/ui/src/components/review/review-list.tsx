// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Review, ReviewStatus, ReviewActivity, ReviewMetric, ReviewSettingsValues } from './types.js';
export interface ReviewListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Review[];
    onSelect?: (item: Review) => void;
    emptyMessage?: string;
}
export function ReviewList({ onSelect, ...props }: ReviewListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Review) : undefined}/>; }
