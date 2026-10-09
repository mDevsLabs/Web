// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Incident, IncidentStatus, IncidentActivity, IncidentMetric, IncidentSettingsValues } from './types.js';
export interface IncidentListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Incident[];
    onSelect?: (item: Incident) => void;
    emptyMessage?: string;
}
export function IncidentList({ onSelect, ...props }: IncidentListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Incident) : undefined}/>; }
