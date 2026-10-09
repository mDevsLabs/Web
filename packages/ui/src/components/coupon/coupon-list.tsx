// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Coupon, CouponStatus, CouponActivity, CouponMetric, CouponSettingsValues } from './types.js';
export interface CouponListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Coupon[];
    onSelect?: (item: Coupon) => void;
    emptyMessage?: string;
}
export function CouponList({ onSelect, ...props }: CouponListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Coupon) : undefined}/>; }
