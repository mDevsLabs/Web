// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainEmptyState, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Review, ReviewStatus, ReviewActivity, ReviewMetric, ReviewSettingsValues } from './types.js';
export interface ReviewEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export function ReviewEmptyState(props: ReviewEmptyStateProps) { return <DomainEmptyState config={config} {...props}/>; }
