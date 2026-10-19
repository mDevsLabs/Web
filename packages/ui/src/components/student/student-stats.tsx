// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainStats, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Student, StudentStatus, StudentActivity, StudentMetric, StudentSettingsValues } from './types.js';
export interface StudentStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly StudentMetric[];
}
export function StudentStats(props: StudentStatsProps) { return <DomainStats config={config} {...props}/>; }
