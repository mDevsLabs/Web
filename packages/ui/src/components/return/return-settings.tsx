// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Return, ReturnStatus, ReturnActivity, ReturnMetric, ReturnSettingsValues } from './types.js';
export interface ReturnSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: ReturnSettingsValues;
    onChange: (key: keyof ReturnSettingsValues, value: boolean) => void;
}
export function ReturnSettings({ onChange, ...props }: ReturnSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof ReturnSettingsValues, value)}/>; }
