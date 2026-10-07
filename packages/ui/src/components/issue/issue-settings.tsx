// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Issue, IssueStatus, IssueActivity, IssueMetric, IssueSettingsValues } from './types.js';
export interface IssueSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: IssueSettingsValues;
    onChange: (key: keyof IssueSettingsValues, value: boolean) => void;
}
export function IssueSettings({ onChange, ...props }: IssueSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof IssueSettingsValues, value)}/>; }
