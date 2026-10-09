// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainEmptyState, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Customer, CustomerStatus, CustomerActivity, CustomerMetric, CustomerSettingsValues } from './types.js';
export interface CustomerEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export function CustomerEmptyState(props: CustomerEmptyStateProps) { return <DomainEmptyState config={config} {...props}/>; }
