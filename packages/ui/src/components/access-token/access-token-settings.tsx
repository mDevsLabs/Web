// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { AccessToken, AccessTokenStatus, AccessTokenActivity, AccessTokenMetric, AccessTokenSettingsValues } from './types.js';
export interface AccessTokenSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: AccessTokenSettingsValues;
    onChange: (key: keyof AccessTokenSettingsValues, value: boolean) => void;
}
export function AccessTokenSettings({ onChange, ...props }: AccessTokenSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof AccessTokenSettingsValues, value)}/>; }
