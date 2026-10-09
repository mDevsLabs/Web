// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainStats, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Integration, IntegrationStatus, IntegrationActivity, IntegrationMetric, IntegrationSettingsValues } from './types.js';
export interface IntegrationStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly IntegrationMetric[];
}
export function IntegrationStats(props: IntegrationStatsProps) { return <DomainStats config={config} {...props}/>; }
