// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Task, TaskStatus, TaskActivity, TaskMetric, TaskSettingsValues } from './types.js';
export interface TaskListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Task[];
    onSelect?: (item: Task) => void;
    emptyMessage?: string;
}
export function TaskList({ onSelect, ...props }: TaskListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Task) : undefined}/>; }
