// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTimeline, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { RestaurantMenu, RestaurantMenuStatus, RestaurantMenuActivity, RestaurantMenuMetric, RestaurantMenuSettingsValues } from './types.js';
export interface RestaurantMenuTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly RestaurantMenuActivity[];
    emptyMessage?: string;
}
export function RestaurantMenuTimeline(props: RestaurantMenuTimelineProps) { return <DomainTimeline config={config} {...props}/>; }
