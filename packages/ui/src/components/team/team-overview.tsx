// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainOverview, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Team, TeamStatus, TeamActivity, TeamMetric, TeamSettingsValues } from './types.js';
export interface TeamOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Team[];
    metrics: readonly TeamMetric[];
}
export function TeamOverview(props: TeamOverviewProps) { return <DomainOverview config={config} {...props}/>; }
