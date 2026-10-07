// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Payment, PaymentStatus, PaymentActivity, PaymentMetric, PaymentSettingsValues } from './types.js';
export interface PaymentListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Payment[];
    onSelect?: (item: Payment) => void;
    emptyMessage?: string;
}
export function PaymentList({ onSelect, ...props }: PaymentListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Payment) : undefined}/>; }
