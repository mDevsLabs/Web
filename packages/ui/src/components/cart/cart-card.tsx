// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainCard, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Cart, CartStatus, CartActivity, CartMetric, CartSettingsValues } from './types.js';
export interface CartCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Cart;
}
export function CartCard(props: CartCardProps) { return <DomainCard config={config} {...props}/>; }
