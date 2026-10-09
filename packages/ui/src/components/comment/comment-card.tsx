// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainCard, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Comment, CommentStatus, CommentActivity, CommentMetric, CommentSettingsValues } from './types.js';
export interface CommentCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Comment;
}
export function CommentCard(props: CommentCardProps) { return <DomainCard config={config} {...props}/>; }
