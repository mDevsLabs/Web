// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainOverview, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Prescription, PrescriptionStatus, PrescriptionActivity, PrescriptionMetric, PrescriptionSettingsValues } from './types.js';
export interface PrescriptionOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Prescription[];
    metrics: readonly PrescriptionMetric[];
}
export function PrescriptionOverview(props: PrescriptionOverviewProps) { return <DomainOverview config={config} {...props}/>; }
