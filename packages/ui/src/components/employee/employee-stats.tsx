// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainStats, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Employee, EmployeeStatus, EmployeeActivity, EmployeeMetric, EmployeeSettingsValues } from './types.js';
export interface EmployeeStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly EmployeeMetric[];
}
export function EmployeeStats(props: EmployeeStatsProps) { return <DomainStats config={config} {...props}/>; }
