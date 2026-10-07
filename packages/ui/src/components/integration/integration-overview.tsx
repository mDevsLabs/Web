// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainOverview, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Integration, IntegrationStatus, IntegrationActivity, IntegrationMetric, IntegrationSettingsValues } from './types.js';
export interface IntegrationOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Integration[];
    metrics: readonly IntegrationMetric[];
}
export function IntegrationOverview(props: IntegrationOverviewProps) { return <DomainOverview config={config} {...props}/>; }
