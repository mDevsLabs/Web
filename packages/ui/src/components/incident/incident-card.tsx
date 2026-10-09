// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainCard, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Incident, IncidentStatus, IncidentActivity, IncidentMetric, IncidentSettingsValues } from './types.js';
export interface IncidentCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Incident;
}
export function IncidentCard(props: IncidentCardProps) { return <DomainCard config={config} {...props}/>; }
