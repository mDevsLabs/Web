// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Certificate, CertificateStatus, CertificateActivity, CertificateMetric, CertificateSettingsValues } from './types.js';
export interface CertificateListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Certificate[];
    onSelect?: (item: Certificate) => void;
    emptyMessage?: string;
}
export function CertificateList({ onSelect, ...props }: CertificateListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Certificate) : undefined}/>; }
