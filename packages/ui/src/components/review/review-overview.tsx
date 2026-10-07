// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainOverview, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Review, ReviewStatus, ReviewActivity, ReviewMetric, ReviewSettingsValues } from './types.js';
export interface ReviewOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Review[];
    metrics: readonly ReviewMetric[];
}
export function ReviewOverview(props: ReviewOverviewProps) { return <DomainOverview config={config} {...props}/>; }
