// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Comment, CommentStatus, CommentActivity, CommentMetric, CommentSettingsValues } from './types.js';
export interface CommentFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Comment>;
    onSubmit: (value: Omit<Comment, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function CommentForm({ onSubmit, ...props }: CommentFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Comment, 'id'>)}/>; }
