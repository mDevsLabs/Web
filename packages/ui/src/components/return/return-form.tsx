// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Return, ReturnStatus, ReturnActivity, ReturnMetric, ReturnSettingsValues } from './types.js';
export interface ReturnFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Return>;
    onSubmit: (value: Omit<Return, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function ReturnForm({ onSubmit, ...props }: ReturnFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Return, 'id'>)}/>; }
