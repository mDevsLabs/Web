// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Coupon, CouponStatus, CouponActivity, CouponMetric, CouponSettingsValues } from './types.js';
export interface CouponSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: CouponSettingsValues;
    onChange: (key: keyof CouponSettingsValues, value: boolean) => void;
}
export function CouponSettings({ onChange, ...props }: CouponSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof CouponSettingsValues, value)}/>; }
