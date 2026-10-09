// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Assignment, AssignmentStatus, AssignmentActivity, AssignmentMetric, AssignmentSettingsValues } from './types.js';
export interface AssignmentListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Assignment[];
    onSelect?: (item: Assignment) => void;
    emptyMessage?: string;
}
export function AssignmentList({ onSelect, ...props }: AssignmentListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Assignment) : undefined}/>; }
