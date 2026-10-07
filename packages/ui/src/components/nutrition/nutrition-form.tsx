// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Nutrition, NutritionStatus, NutritionActivity, NutritionMetric, NutritionSettingsValues } from './types.js';
export interface NutritionFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Nutrition>;
    onSubmit: (value: Omit<Nutrition, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function NutritionForm({ onSubmit, ...props }: NutritionFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Nutrition, 'id'>)}/>; }
