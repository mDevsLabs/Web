// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Webhook, WebhookStatus, WebhookActivity, WebhookMetric, WebhookSettingsValues } from './types.js';
export interface WebhookFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Webhook>;
    onSubmit: (value: Omit<Webhook, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function WebhookForm({ onSubmit, ...props }: WebhookFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Webhook, 'id'>)}/>; }
