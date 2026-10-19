// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainCard, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Monitor, MonitorStatus, MonitorActivity, MonitorMetric, MonitorSettingsValues } from './types.js';
export interface MonitorCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Monitor;
}
export function MonitorCard(props: MonitorCardProps) { return <DomainCard config={config} {...props}/>; }
