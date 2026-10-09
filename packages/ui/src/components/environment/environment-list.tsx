// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Environment, EnvironmentStatus, EnvironmentActivity, EnvironmentMetric, EnvironmentSettingsValues } from './types.js';
export interface EnvironmentListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Environment[];
    onSelect?: (item: Environment) => void;
    emptyMessage?: string;
}
export function EnvironmentList({ onSelect, ...props }: EnvironmentListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Environment) : undefined}/>; }
