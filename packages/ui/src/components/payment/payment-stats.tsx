// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainStats, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Payment, PaymentStatus, PaymentActivity, PaymentMetric, PaymentSettingsValues } from './types.js';
export interface PaymentStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly PaymentMetric[];
}
export function PaymentStats(props: PaymentStatsProps) { return <DomainStats config={config} {...props}/>; }
