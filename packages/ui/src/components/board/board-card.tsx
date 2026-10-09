// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainCard, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Board, BoardStatus, BoardActivity, BoardMetric, BoardSettingsValues } from './types.js';
export interface BoardCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Board;
}
export function BoardCard(props: BoardCardProps) { return <DomainCard config={config} {...props}/>; }
