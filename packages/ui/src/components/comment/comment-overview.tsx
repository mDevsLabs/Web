// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainOverview, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Comment, CommentStatus, CommentActivity, CommentMetric, CommentSettingsValues } from './types.js';
export interface CommentOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Comment[];
    metrics: readonly CommentMetric[];
}
export function CommentOverview(props: CommentOverviewProps) { return <DomainOverview config={config} {...props}/>; }
