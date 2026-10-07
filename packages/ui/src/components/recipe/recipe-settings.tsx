// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Recipe, RecipeStatus, RecipeActivity, RecipeMetric, RecipeSettingsValues } from './types.js';
export interface RecipeSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: RecipeSettingsValues;
    onChange: (key: keyof RecipeSettingsValues, value: boolean) => void;
}
export function RecipeSettings({ onChange, ...props }: RecipeSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof RecipeSettingsValues, value)}/>; }
