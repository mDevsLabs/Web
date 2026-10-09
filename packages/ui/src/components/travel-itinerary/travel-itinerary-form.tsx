// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { TravelItinerary, TravelItineraryStatus, TravelItineraryActivity, TravelItineraryMetric, TravelItinerarySettingsValues } from './types.js';
export interface TravelItineraryFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<TravelItinerary>;
    onSubmit: (value: Omit<TravelItinerary, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function TravelItineraryForm({ onSubmit, ...props }: TravelItineraryFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<TravelItinerary, 'id'>)}/>; }
