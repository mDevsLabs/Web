// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Employee, EmployeeStatus, EmployeeActivity, EmployeeMetric, EmployeeSettingsValues } from './types.js';
export interface EmployeeListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Employee[];
    onSelect?: (item: Employee) => void;
    emptyMessage?: string;
}
export function EmployeeList({ onSelect, ...props }: EmployeeListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Employee) : undefined}/>; }
