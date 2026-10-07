// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Collection, CollectionStatus, CollectionActivity, CollectionMetric, CollectionSettingsValues } from './types.js';
export interface CollectionFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Collection>;
    onSubmit: (value: Omit<Collection, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function CollectionForm({ onSubmit, ...props }: CollectionFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Collection, 'id'>)}/>; }
