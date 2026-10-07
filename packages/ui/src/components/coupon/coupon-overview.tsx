// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainOverview, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Coupon, CouponStatus, CouponActivity, CouponMetric, CouponSettingsValues } from './types.js';
export interface CouponOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Coupon[];
    metrics: readonly CouponMetric[];
}
export function CouponOverview(props: CouponOverviewProps) { return <DomainOverview config={config} {...props}/>; }
