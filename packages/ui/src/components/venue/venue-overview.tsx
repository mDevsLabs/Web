// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainOverview, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Venue, VenueStatus, VenueActivity, VenueMetric, VenueSettingsValues } from './types.js';
export interface VenueOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Venue[];
    metrics: readonly VenueMetric[];
}
export function VenueOverview(props: VenueOverviewProps) { return <DomainOverview config={config} {...props}/>; }
