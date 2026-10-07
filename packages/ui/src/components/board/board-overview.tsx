// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainOverview, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Board, BoardStatus, BoardActivity, BoardMetric, BoardSettingsValues } from './types.js';
export interface BoardOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Board[];
    metrics: readonly BoardMetric[];
}
export function BoardOverview(props: BoardOverviewProps) { return <DomainOverview config={config} {...props}/>; }
