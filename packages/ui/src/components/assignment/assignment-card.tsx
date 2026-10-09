// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainCard, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Assignment, AssignmentStatus, AssignmentActivity, AssignmentMetric, AssignmentSettingsValues } from './types.js';
export interface AssignmentCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Assignment;
}
export function AssignmentCard(props: AssignmentCardProps) { return <DomainCard config={config} {...props}/>; }
