// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainEmptyState, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Release, ReleaseStatus, ReleaseActivity, ReleaseMetric, ReleaseSettingsValues } from './types.js';
export interface ReleaseEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export function ReleaseEmptyState(props: ReleaseEmptyStateProps) { return <DomainEmptyState config={config} {...props}/>; }
