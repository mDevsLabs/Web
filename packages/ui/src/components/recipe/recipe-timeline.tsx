// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTimeline, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Recipe, RecipeStatus, RecipeActivity, RecipeMetric, RecipeSettingsValues } from './types.js';
export interface RecipeTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly RecipeActivity[];
    emptyMessage?: string;
}
export function RecipeTimeline(props: RecipeTimelineProps) { return <DomainTimeline config={config} {...props}/>; }
