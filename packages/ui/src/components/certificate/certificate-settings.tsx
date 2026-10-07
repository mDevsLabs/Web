// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Certificate, CertificateStatus, CertificateActivity, CertificateMetric, CertificateSettingsValues } from './types.js';
export interface CertificateSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: CertificateSettingsValues;
    onChange: (key: keyof CertificateSettingsValues, value: boolean) => void;
}
export function CertificateSettings({ onChange, ...props }: CertificateSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof CertificateSettingsValues, value)}/>; }
