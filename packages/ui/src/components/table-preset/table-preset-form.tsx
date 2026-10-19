// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { TablePreset, TablePresetStatus, TablePresetActivity, TablePresetMetric, TablePresetSettingsValues } from './types.js';
export interface TablePresetFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<TablePreset>;
    onSubmit: (value: Omit<TablePreset, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function TablePresetForm({ onSubmit, ...props }: TablePresetFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<TablePreset, 'id'>)}/>; }
