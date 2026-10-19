// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { GiftCard, GiftCardStatus, GiftCardActivity, GiftCardMetric, GiftCardSettingsValues } from './types.js';
export interface GiftCardSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: GiftCardSettingsValues;
    onChange: (key: keyof GiftCardSettingsValues, value: boolean) => void;
}
export function GiftCardSettings({ onChange, ...props }: GiftCardSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof GiftCardSettingsValues, value)}/>; }
