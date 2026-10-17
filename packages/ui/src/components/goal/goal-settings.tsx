// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Goal, GoalStatus, GoalActivity, GoalMetric, GoalSettingsValues } from './types.js';
export interface GoalSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: GoalSettingsValues;
    onChange: (key: keyof GoalSettingsValues, value: boolean) => void;
}
export function GoalSettings({ onChange, ...props }: GoalSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof GoalSettingsValues, value)}/>; }
