// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTable, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Checkout, CheckoutStatus, CheckoutActivity, CheckoutMetric, CheckoutSettingsValues } from './types.js';
export interface CheckoutTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Checkout[];
    emptyMessage?: string;
}
export function CheckoutTable(props: CheckoutTableProps) { return <DomainTable config={config} {...props}/>; }
