// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Nutrition, NutritionStatus, NutritionActivity, NutritionMetric, NutritionSettingsValues } from './types.js';
export interface NutritionSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: NutritionSettingsValues;
    onChange: (key: keyof NutritionSettingsValues, value: boolean) => void;
}
export function NutritionSettings({ onChange, ...props }: NutritionSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof NutritionSettingsValues, value)}/>; }
