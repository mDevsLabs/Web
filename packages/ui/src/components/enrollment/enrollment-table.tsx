// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTable, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Enrollment, EnrollmentStatus, EnrollmentActivity, EnrollmentMetric, EnrollmentSettingsValues } from './types.js';
export interface EnrollmentTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Enrollment[];
    emptyMessage?: string;
}
export function EnrollmentTable(props: EnrollmentTableProps) { return <DomainTable config={config} {...props}/>; }
