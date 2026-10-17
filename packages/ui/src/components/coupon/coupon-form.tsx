// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Coupon, CouponStatus, CouponActivity, CouponMetric, CouponSettingsValues } from './types.js';
export interface CouponFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Coupon>;
    onSubmit: (value: Omit<Coupon, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function CouponForm({ onSubmit, ...props }: CouponFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Coupon, 'id'>)}/>; }
