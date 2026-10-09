// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Contract, ContractStatus, ContractActivity, ContractMetric, ContractSettingsValues } from './types.js';
export interface ContractFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Contract>;
    onSubmit: (value: Omit<Contract, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function ContractForm({ onSubmit, ...props }: ContractFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Contract, 'id'>)}/>; }
