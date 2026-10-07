// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainEmptyState, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Pipeline, PipelineStatus, PipelineActivity, PipelineMetric, PipelineSettingsValues } from './types.js';
export interface PipelineEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export function PipelineEmptyState(props: PipelineEmptyStateProps) { return <DomainEmptyState config={config} {...props}/>; }
