// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainOverview, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { AccessToken, AccessTokenStatus, AccessTokenActivity, AccessTokenMetric, AccessTokenSettingsValues } from './types.js';
export interface AccessTokenOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly AccessToken[];
    metrics: readonly AccessTokenMetric[];
}
export function AccessTokenOverview(props: AccessTokenOverviewProps) { return <DomainOverview config={config} {...props}/>; }
