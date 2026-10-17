// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Review, ReviewStatus, ReviewActivity, ReviewMetric, ReviewSettingsValues } from './types.js';
export interface ReviewSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: ReviewSettingsValues;
    onChange: (key: keyof ReviewSettingsValues, value: boolean) => void;
}
export function ReviewSettings({ onChange, ...props }: ReviewSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof ReviewSettingsValues, value)}/>; }
