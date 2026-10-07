// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainOverview, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Audience, AudienceStatus, AudienceActivity, AudienceMetric, AudienceSettingsValues } from './types.js';
export interface AudienceOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Audience[];
    metrics: readonly AudienceMetric[];
}
export function AudienceOverview(props: AudienceOverviewProps) { return <DomainOverview config={config} {...props}/>; }
