// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainOverview, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Assignment, AssignmentStatus, AssignmentActivity, AssignmentMetric, AssignmentSettingsValues } from './types.js';
export interface AssignmentOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Assignment[];
    metrics: readonly AssignmentMetric[];
}
export function AssignmentOverview(props: AssignmentOverviewProps) { return <DomainOverview config={config} {...props}/>; }
