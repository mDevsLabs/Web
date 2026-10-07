// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainOverview, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Product, ProductStatus, ProductActivity, ProductMetric, ProductSettingsValues } from './types.js';
export interface ProductOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Product[];
    metrics: readonly ProductMetric[];
}
export function ProductOverview(props: ProductOverviewProps) { return <DomainOverview config={config} {...props}/>; }
