// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Deal, DealStatus, DealActivity, DealMetric, DealSettingsValues } from './types.js';
export interface DealFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Deal>;
    onSubmit: (value: Omit<Deal, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function DealForm({ onSubmit, ...props }: DealFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Deal, 'id'>)}/>; }
