// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTimeline, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Nutrition, NutritionStatus, NutritionActivity, NutritionMetric, NutritionSettingsValues } from './types.js';
export interface NutritionTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly NutritionActivity[];
    emptyMessage?: string;
}
export function NutritionTimeline(props: NutritionTimelineProps) { return <DomainTimeline config={config} {...props}/>; }
