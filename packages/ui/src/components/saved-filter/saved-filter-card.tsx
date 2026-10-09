// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainCard, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { SavedFilter, SavedFilterStatus, SavedFilterActivity, SavedFilterMetric, SavedFilterSettingsValues } from './types.js';
export interface SavedFilterCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: SavedFilter;
}
export function SavedFilterCard(props: SavedFilterCardProps) { return <DomainCard config={config} {...props}/>; }
