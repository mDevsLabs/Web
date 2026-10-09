// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainOverview, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Monitor, MonitorStatus, MonitorActivity, MonitorMetric, MonitorSettingsValues } from './types.js';
export interface MonitorOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Monitor[];
    metrics: readonly MonitorMetric[];
}
export function MonitorOverview(props: MonitorOverviewProps) { return <DomainOverview config={config} {...props}/>; }
