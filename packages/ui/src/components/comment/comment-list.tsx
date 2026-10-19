// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Comment, CommentStatus, CommentActivity, CommentMetric, CommentSettingsValues } from './types.js';
export interface CommentListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Comment[];
    onSelect?: (item: Comment) => void;
    emptyMessage?: string;
}
export function CommentList({ onSelect, ...props }: CommentListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Comment) : undefined}/>; }
