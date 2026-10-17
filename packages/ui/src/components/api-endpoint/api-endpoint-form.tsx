// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { ApiEndpoint, ApiEndpointStatus, ApiEndpointActivity, ApiEndpointMetric, ApiEndpointSettingsValues } from './types.js';
export interface ApiEndpointFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<ApiEndpoint>;
    onSubmit: (value: Omit<ApiEndpoint, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function ApiEndpointForm({ onSubmit, ...props }: ApiEndpointFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<ApiEndpoint, 'id'>)}/>; }
