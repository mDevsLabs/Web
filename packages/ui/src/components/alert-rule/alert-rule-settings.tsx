// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { AlertRule, AlertRuleStatus, AlertRuleActivity, AlertRuleMetric, AlertRuleSettingsValues } from './types.js';
export interface AlertRuleSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: AlertRuleSettingsValues;
    onChange: (key: keyof AlertRuleSettingsValues, value: boolean) => void;
}
export function AlertRuleSettings({ onChange, ...props }: AlertRuleSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof AlertRuleSettingsValues, value)}/>; }
