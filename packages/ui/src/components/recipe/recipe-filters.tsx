// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainFilters, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Recipe, RecipeStatus, RecipeActivity, RecipeMetric, RecipeSettingsValues } from './types.js';
export interface RecipeFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: RecipeStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: RecipeStatus | '') => void;
}
export function RecipeFilters({ onStatusChange, ...props }: RecipeFiltersProps) { return <DomainFilters config={config} {...props} onStatusChange={onStatusChange ? value => onStatusChange(value as RecipeStatus | '') : undefined}/>; }
