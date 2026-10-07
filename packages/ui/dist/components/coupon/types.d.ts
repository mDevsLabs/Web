import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Coupon = {
    id?: string;
    code: string;
    discountPercent: number;
    expiresOn: string;
    usageCount: number;
    status: "draft" | "active" | "expired";
};
export type CouponStatus = Coupon['status'];
export interface CouponActivity extends DomainActivity {
    couponId?: string;
}
export type CouponMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalCoupon' | 'activeCoupon' | 'valueCoupon';
};
export type CouponSettingsValues = Partial<Record<"notifyCoupon" | "archiveCoupon" | "approveCoupon", boolean>>;
