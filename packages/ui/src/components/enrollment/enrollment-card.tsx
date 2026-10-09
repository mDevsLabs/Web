// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainCard, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Enrollment, EnrollmentStatus, EnrollmentActivity, EnrollmentMetric, EnrollmentSettingsValues } from './types.js';
export interface EnrollmentCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Enrollment;
}
export function EnrollmentCard(props: EnrollmentCardProps) { return <DomainCard config={config} {...props}/>; }
