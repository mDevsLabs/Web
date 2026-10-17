// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { MediaAsset, MediaAssetStatus, MediaAssetActivity, MediaAssetMetric, MediaAssetSettingsValues } from './types.js';
export interface MediaAssetSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: MediaAssetSettingsValues;
    onChange: (key: keyof MediaAssetSettingsValues, value: boolean) => void;
}
export function MediaAssetSettings({ onChange, ...props }: MediaAssetSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof MediaAssetSettingsValues, value)}/>; }
