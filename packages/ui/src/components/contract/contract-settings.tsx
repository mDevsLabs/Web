// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Contract, ContractStatus, ContractActivity, ContractMetric, ContractSettingsValues } from './types.js';
export interface ContractSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: ContractSettingsValues;
    onChange: (key: keyof ContractSettingsValues, value: boolean) => void;
}
export function ContractSettings({ onChange, ...props }: ContractSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof ContractSettingsValues, value)}/>; }
