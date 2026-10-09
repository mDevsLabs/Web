// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainFilters, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Certificate, CertificateStatus, CertificateActivity, CertificateMetric, CertificateSettingsValues } from './types.js';
export interface CertificateFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: CertificateStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: CertificateStatus | '') => void;
}
export function CertificateFilters({ onStatusChange, ...props }: CertificateFiltersProps) { return <DomainFilters config={config} {...props} onStatusChange={onStatusChange ? value => onStatusChange(value as CertificateStatus | '') : undefined}/>; }
