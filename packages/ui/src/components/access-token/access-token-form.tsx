// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { AccessToken, AccessTokenStatus, AccessTokenActivity, AccessTokenMetric, AccessTokenSettingsValues } from './types.js';
export interface AccessTokenFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<AccessToken>;
    onSubmit: (value: Omit<AccessToken, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function AccessTokenForm({ onSubmit, ...props }: AccessTokenFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<AccessToken, 'id'>)}/>; }
