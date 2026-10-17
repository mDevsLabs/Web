// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Recipe, RecipeStatus, RecipeActivity, RecipeMetric, RecipeSettingsValues } from './types.js';
export interface RecipeListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Recipe[];
    onSelect?: (item: Recipe) => void;
    emptyMessage?: string;
}
export function RecipeList({ onSelect, ...props }: RecipeListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Recipe) : undefined}/>; }
