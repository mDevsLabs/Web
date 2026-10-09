// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainFilters, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Nutrition, NutritionStatus, NutritionActivity, NutritionMetric, NutritionSettingsValues } from './types.js';
export interface NutritionFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: NutritionStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: NutritionStatus | '') => void;
}
export function NutritionFilters({ onStatusChange, ...props }: NutritionFiltersProps) { return <DomainFilters config={config} {...props} onStatusChange={onStatusChange ? value => onStatusChange(value as NutritionStatus | '') : undefined}/>; }
