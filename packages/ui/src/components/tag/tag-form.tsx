// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Tag, TagStatus, TagActivity, TagMetric, TagSettingsValues } from './types.js';
export interface TagFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Tag>;
    onSubmit: (value: Omit<Tag, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function TagForm({ onSubmit, ...props }: TagFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Tag, 'id'>)}/>; }
