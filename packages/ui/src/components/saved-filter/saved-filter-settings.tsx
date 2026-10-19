// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { SavedFilter, SavedFilterStatus, SavedFilterActivity, SavedFilterMetric, SavedFilterSettingsValues } from './types.js';
export interface SavedFilterSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: SavedFilterSettingsValues;
    onChange: (key: keyof SavedFilterSettingsValues, value: boolean) => void;
}
export function SavedFilterSettings({ onChange, ...props }: SavedFilterSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof SavedFilterSettingsValues, value)}/>; }
