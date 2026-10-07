// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Nutrition, NutritionStatus, NutritionActivity, NutritionMetric, NutritionSettingsValues } from './types.js';
export interface NutritionListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Nutrition[];
    onSelect?: (item: Nutrition) => void;
    emptyMessage?: string;
}
export function NutritionList({ onSelect, ...props }: NutritionListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Nutrition) : undefined}/>; }
