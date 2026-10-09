// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Release, ReleaseStatus, ReleaseActivity, ReleaseMetric, ReleaseSettingsValues } from './types.js';
export interface ReleaseListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Release[];
    onSelect?: (item: Release) => void;
    emptyMessage?: string;
}
export function ReleaseList({ onSelect, ...props }: ReleaseListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Release) : undefined}/>; }
