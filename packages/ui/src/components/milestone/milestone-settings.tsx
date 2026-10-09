// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Milestone, MilestoneStatus, MilestoneActivity, MilestoneMetric, MilestoneSettingsValues } from './types.js';
export interface MilestoneSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: MilestoneSettingsValues;
    onChange: (key: keyof MilestoneSettingsValues, value: boolean) => void;
}
export function MilestoneSettings({ onChange, ...props }: MilestoneSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof MilestoneSettingsValues, value)}/>; }
