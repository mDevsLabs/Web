// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTable, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Venue, VenueStatus, VenueActivity, VenueMetric, VenueSettingsValues } from './types.js';
export interface VenueTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Venue[];
    emptyMessage?: string;
}
export function VenueTable(props: VenueTableProps) { return <DomainTable config={config} {...props}/>; }
