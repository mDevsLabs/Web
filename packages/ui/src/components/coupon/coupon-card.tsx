// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainCard, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Coupon, CouponStatus, CouponActivity, CouponMetric, CouponSettingsValues } from './types.js';
export interface CouponCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Coupon;
}
export function CouponCard(props: CouponCardProps) { return <DomainCard config={config} {...props}/>; }
