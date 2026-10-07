// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Contract, ContractStatus, ContractActivity, ContractMetric, ContractSettingsValues } from './types.js';
export interface ContractListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Contract[];
    onSelect?: (item: Contract) => void;
    emptyMessage?: string;
}
export function ContractList({ onSelect, ...props }: ContractListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Contract) : undefined}/>; }
