// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainEmptyState, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Meeting, MeetingStatus, MeetingActivity, MeetingMetric, MeetingSettingsValues } from './types.js';
export interface MeetingEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export function MeetingEmptyState(props: MeetingEmptyStateProps) { return <DomainEmptyState config={config} {...props}/>; }
