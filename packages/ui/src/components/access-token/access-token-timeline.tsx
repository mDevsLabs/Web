// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTimeline, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { AccessToken, AccessTokenStatus, AccessTokenActivity, AccessTokenMetric, AccessTokenSettingsValues } from './types.js';
export interface AccessTokenTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly AccessTokenActivity[];
    emptyMessage?: string;
}
export function AccessTokenTimeline(props: AccessTokenTimelineProps) { return <DomainTimeline config={config} {...props}/>; }
