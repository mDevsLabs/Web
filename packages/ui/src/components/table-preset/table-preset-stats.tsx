// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainStats, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { TablePreset, TablePresetStatus, TablePresetActivity, TablePresetMetric, TablePresetSettingsValues } from './types.js';
export interface TablePresetStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly TablePresetMetric[];
}
export function TablePresetStats(props: TablePresetStatsProps) { return <DomainStats config={config} {...props}/>; }
