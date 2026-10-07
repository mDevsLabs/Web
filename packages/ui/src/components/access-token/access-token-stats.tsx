// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainStats, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { AccessToken, AccessTokenStatus, AccessTokenActivity, AccessTokenMetric, AccessTokenSettingsValues } from './types.js';
export interface AccessTokenStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly AccessTokenMetric[];
}
export function AccessTokenStats(props: AccessTokenStatsProps) { return <DomainStats config={config} {...props}/>; }
