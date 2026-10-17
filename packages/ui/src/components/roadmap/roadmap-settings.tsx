// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Roadmap, RoadmapStatus, RoadmapActivity, RoadmapMetric, RoadmapSettingsValues } from './types.js';
export interface RoadmapSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: RoadmapSettingsValues;
    onChange: (key: keyof RoadmapSettingsValues, value: boolean) => void;
}
export function RoadmapSettings({ onChange, ...props }: RoadmapSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof RoadmapSettingsValues, value)}/>; }
