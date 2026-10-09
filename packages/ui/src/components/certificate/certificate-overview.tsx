// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainOverview, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Certificate, CertificateStatus, CertificateActivity, CertificateMetric, CertificateSettingsValues } from './types.js';
export interface CertificateOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Certificate[];
    metrics: readonly CertificateMetric[];
}
export function CertificateOverview(props: CertificateOverviewProps) { return <DomainOverview config={config} {...props}/>; }
