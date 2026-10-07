// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { PullRequest, PullRequestStatus, PullRequestActivity, PullRequestMetric, PullRequestSettingsValues } from './types.js';
export interface PullRequestSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: PullRequestSettingsValues;
    onChange: (key: keyof PullRequestSettingsValues, value: boolean) => void;
}
export function PullRequestSettings({ onChange, ...props }: PullRequestSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof PullRequestSettingsValues, value)}/>; }
