// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainCard, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Deal, DealStatus, DealActivity, DealMetric, DealSettingsValues } from './types.js';
export interface DealCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Deal;
}
export function DealCard(props: DealCardProps) { return <DomainCard config={config} {...props}/>; }
