// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainOverview, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Return, ReturnStatus, ReturnActivity, ReturnMetric, ReturnSettingsValues } from './types.js';
export interface ReturnOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Return[];
    metrics: readonly ReturnMetric[];
}
export function ReturnOverview(props: ReturnOverviewProps) { return <DomainOverview config={config} {...props}/>; }
