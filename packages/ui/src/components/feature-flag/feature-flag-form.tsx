// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { FeatureFlag, FeatureFlagStatus, FeatureFlagActivity, FeatureFlagMetric, FeatureFlagSettingsValues } from './types.js';
export interface FeatureFlagFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<FeatureFlag>;
    onSubmit: (value: Omit<FeatureFlag, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function FeatureFlagForm({ onSubmit, ...props }: FeatureFlagFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<FeatureFlag, 'id'>)}/>; }
