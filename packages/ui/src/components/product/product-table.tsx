// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTable, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Product, ProductStatus, ProductActivity, ProductMetric, ProductSettingsValues } from './types.js';
export interface ProductTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Product[];
    emptyMessage?: string;
}
export function ProductTable(props: ProductTableProps) { return <DomainTable config={config} {...props}/>; }
