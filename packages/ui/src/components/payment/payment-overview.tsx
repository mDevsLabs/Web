// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainOverview, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Payment, PaymentStatus, PaymentActivity, PaymentMetric, PaymentSettingsValues } from './types.js';
export interface PaymentOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Payment[];
    metrics: readonly PaymentMetric[];
}
export function PaymentOverview(props: PaymentOverviewProps) { return <DomainOverview config={config} {...props}/>; }
