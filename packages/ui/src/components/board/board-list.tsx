// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Board, BoardStatus, BoardActivity, BoardMetric, BoardSettingsValues } from './types.js';
export interface BoardListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Board[];
    onSelect?: (item: Board) => void;
    emptyMessage?: string;
}
export function BoardList({ onSelect, ...props }: BoardListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Board) : undefined}/>; }
