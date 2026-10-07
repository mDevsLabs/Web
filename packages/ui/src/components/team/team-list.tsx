// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Team, TeamStatus, TeamActivity, TeamMetric, TeamSettingsValues } from './types.js';
export interface TeamListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Team[];
    onSelect?: (item: Team) => void;
    emptyMessage?: string;
}
export function TeamList({ onSelect, ...props }: TeamListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Team) : undefined}/>; }
