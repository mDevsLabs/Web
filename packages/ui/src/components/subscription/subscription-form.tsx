// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Subscription, SubscriptionStatus, SubscriptionActivity, SubscriptionMetric, SubscriptionSettingsValues } from './types.js';
export interface SubscriptionFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Subscription>;
    onSubmit: (value: Omit<Subscription, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function SubscriptionForm({ onSubmit, ...props }: SubscriptionFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Subscription, 'id'>)}/>; }
