// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainCard, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Employee, EmployeeStatus, EmployeeActivity, EmployeeMetric, EmployeeSettingsValues } from './types.js';
export interface EmployeeCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Employee;
}
export function EmployeeCard(props: EmployeeCardProps) { return <DomainCard config={config} {...props}/>; }
