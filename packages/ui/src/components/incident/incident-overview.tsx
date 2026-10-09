// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainOverview, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Incident, IncidentStatus, IncidentActivity, IncidentMetric, IncidentSettingsValues } from './types.js';
export interface IncidentOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Incident[];
    metrics: readonly IncidentMetric[];
}
export function IncidentOverview(props: IncidentOverviewProps) { return <DomainOverview config={config} {...props}/>; }
