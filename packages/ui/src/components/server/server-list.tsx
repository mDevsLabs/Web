// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Server, ServerStatus, ServerActivity, ServerMetric, ServerSettingsValues } from './types.js';
export interface ServerListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Server[];
    onSelect?: (item: Server) => void;
    emptyMessage?: string;
}
export function ServerList({ onSelect, ...props }: ServerListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Server) : undefined}/>; }
