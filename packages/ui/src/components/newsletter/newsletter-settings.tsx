// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Newsletter, NewsletterStatus, NewsletterActivity, NewsletterMetric, NewsletterSettingsValues } from './types.js';
export interface NewsletterSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: NewsletterSettingsValues;
    onChange: (key: keyof NewsletterSettingsValues, value: boolean) => void;
}
export function NewsletterSettings({ onChange, ...props }: NewsletterSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof NewsletterSettingsValues, value)}/>; }
