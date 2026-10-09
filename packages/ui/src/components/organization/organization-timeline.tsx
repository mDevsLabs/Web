// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTimeline, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Organization, OrganizationStatus, OrganizationActivity, OrganizationMetric, OrganizationSettingsValues } from './types.js';
export interface OrganizationTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly OrganizationActivity[];
    emptyMessage?: string;
}
export function OrganizationTimeline(props: OrganizationTimelineProps) { return <DomainTimeline config={config} {...props}/>; }
