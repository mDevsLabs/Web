// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainStats, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Enrollment, EnrollmentStatus, EnrollmentActivity, EnrollmentMetric, EnrollmentSettingsValues } from './types.js';
export interface EnrollmentStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly EnrollmentMetric[];
}
export function EnrollmentStats(props: EnrollmentStatsProps) { return <DomainStats config={config} {...props}/>; }
