// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTable, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Recipe, RecipeStatus, RecipeActivity, RecipeMetric, RecipeSettingsValues } from './types.js';
export interface RecipeTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Recipe[];
    emptyMessage?: string;
}
export function RecipeTable(props: RecipeTableProps) { return <DomainTable config={config} {...props}/>; }
