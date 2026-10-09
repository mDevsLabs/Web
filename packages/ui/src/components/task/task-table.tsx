// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTable, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Task, TaskStatus, TaskActivity, TaskMetric, TaskSettingsValues } from './types.js';
export interface TaskTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Task[];
    emptyMessage?: string;
}
export function TaskTable(props: TaskTableProps) { return <DomainTable config={config} {...props}/>; }
