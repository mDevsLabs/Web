// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { MediaAsset, MediaAssetStatus, MediaAssetActivity, MediaAssetMetric, MediaAssetSettingsValues } from './types.js';
export interface MediaAssetFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<MediaAsset>;
    onSubmit: (value: Omit<MediaAsset, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function MediaAssetForm({ onSubmit, ...props }: MediaAssetFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<MediaAsset, 'id'>)}/>; }
