// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Review, ReviewStatus, ReviewActivity, ReviewMetric, ReviewSettingsValues } from './types.js';
export interface ReviewFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Review>;
    onSubmit: (value: Omit<Review, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function ReviewForm({ onSubmit, ...props }: ReviewFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Review, 'id'>)}/>; }
