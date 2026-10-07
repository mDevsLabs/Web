// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainOverview, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Flight, FlightStatus, FlightActivity, FlightMetric, FlightSettingsValues } from './types.js';
export interface FlightOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Flight[];
    metrics: readonly FlightMetric[];
}
export function FlightOverview(props: FlightOverviewProps) { return <DomainOverview config={config} {...props}/>; }
