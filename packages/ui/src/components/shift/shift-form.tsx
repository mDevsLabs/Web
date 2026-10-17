// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Shift, ShiftStatus, ShiftActivity, ShiftMetric, ShiftSettingsValues } from './types.js';
export interface ShiftFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Shift>;
    onSubmit: (value: Omit<Shift, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function ShiftForm({ onSubmit, ...props }: ShiftFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Shift, 'id'>)}/>; }
