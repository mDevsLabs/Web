// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTable, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Roadmap, RoadmapStatus, RoadmapActivity, RoadmapMetric, RoadmapSettingsValues } from './types.js';
export interface RoadmapTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Roadmap[];
    emptyMessage?: string;
}
export function RoadmapTable(props: RoadmapTableProps) { return <DomainTable config={config} {...props}/>; }
