// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Destination, DestinationStatus, DestinationActivity, DestinationMetric, DestinationSettingsValues } from './types.js';
export interface DestinationFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Destination>;
    onSubmit: (value: Omit<Destination, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function DestinationForm({ onSubmit, ...props }: DestinationFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Destination, 'id'>)}/>; }
