// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainCard, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Venue, VenueStatus, VenueActivity, VenueMetric, VenueSettingsValues } from './types.js';
export interface VenueCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Venue;
}
export function VenueCard(props: VenueCardProps) { return <DomainCard config={config} {...props}/>; }
