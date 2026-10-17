// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Checkout, CheckoutStatus, CheckoutActivity, CheckoutMetric, CheckoutSettingsValues } from './types.js';
export interface CheckoutListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Checkout[];
    onSelect?: (item: Checkout) => void;
    emptyMessage?: string;
}
export function CheckoutList({ onSelect, ...props }: CheckoutListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Checkout) : undefined}/>; }
