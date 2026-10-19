// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Venue, VenueStatus, VenueActivity, VenueMetric, VenueSettingsValues } from './types.js';
export interface VenueFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Venue>;
    onSubmit: (value: Omit<Venue, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function VenueForm({ onSubmit, ...props }: VenueFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Venue, 'id'>)}/>; }
