// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Product, ProductStatus, ProductActivity, ProductMetric, ProductSettingsValues } from './types.js';
export interface ProductListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Product[];
    onSelect?: (item: Product) => void;
    emptyMessage?: string;
}
export function ProductList({ onSelect, ...props }: ProductListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Product) : undefined}/>; }
