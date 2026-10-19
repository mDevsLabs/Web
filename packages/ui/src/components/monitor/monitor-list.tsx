// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Monitor, MonitorStatus, MonitorActivity, MonitorMetric, MonitorSettingsValues } from './types.js';
export interface MonitorListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Monitor[];
    onSelect?: (item: Monitor) => void;
    emptyMessage?: string;
}
export function MonitorList({ onSelect, ...props }: MonitorListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Monitor) : undefined}/>; }
