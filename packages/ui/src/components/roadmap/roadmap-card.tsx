// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainCard, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Roadmap, RoadmapStatus, RoadmapActivity, RoadmapMetric, RoadmapSettingsValues } from './types.js';
export interface RoadmapCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Roadmap;
}
export function RoadmapCard(props: RoadmapCardProps) { return <DomainCard config={config} {...props}/>; }
