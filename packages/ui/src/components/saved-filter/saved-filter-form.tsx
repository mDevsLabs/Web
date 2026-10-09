// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { SavedFilter, SavedFilterStatus, SavedFilterActivity, SavedFilterMetric, SavedFilterSettingsValues } from './types.js';
export interface SavedFilterFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<SavedFilter>;
    onSubmit: (value: Omit<SavedFilter, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function SavedFilterForm({ onSubmit, ...props }: SavedFilterFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<SavedFilter, 'id'>)}/>; }
