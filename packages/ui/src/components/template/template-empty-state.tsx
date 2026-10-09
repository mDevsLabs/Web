// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainEmptyState, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Template, TemplateStatus, TemplateActivity, TemplateMetric, TemplateSettingsValues } from './types.js';
export interface TemplateEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export function TemplateEmptyState(props: TemplateEmptyStateProps) { return <DomainEmptyState config={config} {...props}/>; }
