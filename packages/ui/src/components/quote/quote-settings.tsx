// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Quote, QuoteStatus, QuoteActivity, QuoteMetric, QuoteSettingsValues } from './types.js';
export interface QuoteSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: QuoteSettingsValues;
    onChange: (key: keyof QuoteSettingsValues, value: boolean) => void;
}
export function QuoteSettings({ onChange, ...props }: QuoteSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof QuoteSettingsValues, value)}/>; }
