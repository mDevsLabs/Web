// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Roadmap, RoadmapStatus, RoadmapActivity, RoadmapMetric, RoadmapSettingsValues } from './types.js';
export interface RoadmapListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Roadmap[];
    onSelect?: (item: Roadmap) => void;
    emptyMessage?: string;
}
export function RoadmapList({ onSelect, ...props }: RoadmapListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Roadmap) : undefined}/>; }
