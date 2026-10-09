// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Integration, IntegrationStatus, IntegrationActivity, IntegrationMetric, IntegrationSettingsValues } from './types.js';
export interface IntegrationListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Integration[];
    onSelect?: (item: Integration) => void;
    emptyMessage?: string;
}
export function IntegrationList({ onSelect, ...props }: IntegrationListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Integration) : undefined}/>; }
