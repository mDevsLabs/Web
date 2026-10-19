// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { SleepSession, SleepSessionStatus, SleepSessionActivity, SleepSessionMetric, SleepSessionSettingsValues } from './types.js';
export interface SleepSessionListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly SleepSession[];
    onSelect?: (item: SleepSession) => void;
    emptyMessage?: string;
}
export function SleepSessionList({ onSelect, ...props }: SleepSessionListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as SleepSession) : undefined}/>; }
