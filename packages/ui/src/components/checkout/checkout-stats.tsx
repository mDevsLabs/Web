// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainStats, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Checkout, CheckoutStatus, CheckoutActivity, CheckoutMetric, CheckoutSettingsValues } from './types.js';
export interface CheckoutStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly CheckoutMetric[];
}
export function CheckoutStats(props: CheckoutStatsProps) { return <DomainStats config={config} {...props}/>; }
