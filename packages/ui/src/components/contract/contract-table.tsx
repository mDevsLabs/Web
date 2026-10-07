// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTable, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Contract, ContractStatus, ContractActivity, ContractMetric, ContractSettingsValues } from './types.js';
export interface ContractTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Contract[];
    emptyMessage?: string;
}
export function ContractTable(props: ContractTableProps) { return <DomainTable config={config} {...props}/>; }
