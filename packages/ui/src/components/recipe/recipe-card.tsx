// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainCard, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Recipe, RecipeStatus, RecipeActivity, RecipeMetric, RecipeSettingsValues } from './types.js';
export interface RecipeCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Recipe;
}
export function RecipeCard(props: RecipeCardProps) { return <DomainCard config={config} {...props}/>; }
