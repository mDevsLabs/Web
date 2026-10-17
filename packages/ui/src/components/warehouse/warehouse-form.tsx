// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Warehouse, WarehouseStatus, WarehouseActivity, WarehouseMetric, WarehouseSettingsValues } from './types.js';
export interface WarehouseFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Warehouse>;
    onSubmit: (value: Omit<Warehouse, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function WarehouseForm({ onSubmit, ...props }: WarehouseFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Warehouse, 'id'>)}/>; }
