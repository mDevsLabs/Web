// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainEmptyState, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Board, BoardStatus, BoardActivity, BoardMetric, BoardSettingsValues } from './types.js';
export interface BoardEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export function BoardEmptyState(props: BoardEmptyStateProps) { return <DomainEmptyState config={config} {...props}/>; }
