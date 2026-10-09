// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTable, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Coupon, CouponStatus, CouponActivity, CouponMetric, CouponSettingsValues } from './types.js';
export interface CouponTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Coupon[];
    emptyMessage?: string;
}
export function CouponTable(props: CouponTableProps) { return <DomainTable config={config} {...props}/>; }
