// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainCard, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Task, TaskStatus, TaskActivity, TaskMetric, TaskSettingsValues } from './types.js';
export interface TaskCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Task;
}
export function TaskCard(props: TaskCardProps) { return <DomainCard config={config} {...props}/>; }
