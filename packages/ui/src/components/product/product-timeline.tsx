// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTimeline, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Product, ProductStatus, ProductActivity, ProductMetric, ProductSettingsValues } from './types.js';
export interface ProductTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly ProductActivity[];
    emptyMessage?: string;
}
export function ProductTimeline(props: ProductTimelineProps) { return <DomainTimeline config={config} {...props}/>; }
