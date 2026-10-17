// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Enrollment, EnrollmentStatus, EnrollmentActivity, EnrollmentMetric, EnrollmentSettingsValues } from './types.js';
export interface EnrollmentListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Enrollment[];
    onSelect?: (item: Enrollment) => void;
    emptyMessage?: string;
}
export function EnrollmentList({ onSelect, ...props }: EnrollmentListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Enrollment) : undefined}/>; }
