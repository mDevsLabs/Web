// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { RestaurantMenu, RestaurantMenuStatus, RestaurantMenuActivity, RestaurantMenuMetric, RestaurantMenuSettingsValues } from './types.js';
export interface RestaurantMenuFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<RestaurantMenu>;
    onSubmit: (value: Omit<RestaurantMenu, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function RestaurantMenuForm({ onSubmit, ...props }: RestaurantMenuFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<RestaurantMenu, 'id'>)}/>; }
