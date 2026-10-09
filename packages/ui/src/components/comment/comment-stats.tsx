// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainStats, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Comment, CommentStatus, CommentActivity, CommentMetric, CommentSettingsValues } from './types.js';
export interface CommentStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly CommentMetric[];
}
export function CommentStats(props: CommentStatsProps) { return <DomainStats config={config} {...props}/>; }
