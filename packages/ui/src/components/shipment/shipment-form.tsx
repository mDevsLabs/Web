// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Shipment, ShipmentStatus, ShipmentActivity, ShipmentMetric, ShipmentSettingsValues } from './types.js';
export interface ShipmentFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Shipment>;
    onSubmit: (value: Omit<Shipment, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function ShipmentForm({ onSubmit, ...props }: ShipmentFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Shipment, 'id'>)}/>; }
