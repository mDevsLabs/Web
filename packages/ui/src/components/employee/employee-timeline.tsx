// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTimeline, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Employee, EmployeeStatus, EmployeeActivity, EmployeeMetric, EmployeeSettingsValues } from './types.js';
export interface EmployeeTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly EmployeeActivity[];
    emptyMessage?: string;
}
export function EmployeeTimeline(props: EmployeeTimelineProps) { return <DomainTimeline config={config} {...props}/>; }
