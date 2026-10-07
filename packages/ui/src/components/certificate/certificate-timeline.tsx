// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTimeline, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Certificate, CertificateStatus, CertificateActivity, CertificateMetric, CertificateSettingsValues } from './types.js';
export interface CertificateTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly CertificateActivity[];
    emptyMessage?: string;
}
export function CertificateTimeline(props: CertificateTimelineProps) { return <DomainTimeline config={config} {...props}/>; }
