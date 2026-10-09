// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTimeline, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Coupon, CouponStatus, CouponActivity, CouponMetric, CouponSettingsValues } from './types.js';
export interface CouponTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly CouponActivity[];
    emptyMessage?: string;
}
export function CouponTimeline(props: CouponTimelineProps) { return <DomainTimeline config={config} {...props}/>; }
