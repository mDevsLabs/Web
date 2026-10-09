// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainFilters, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Contract, ContractStatus, ContractActivity, ContractMetric, ContractSettingsValues } from './types.js';
export interface ContractFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: ContractStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: ContractStatus | '') => void;
}
export function ContractFilters({ onStatusChange, ...props }: ContractFiltersProps) { return <DomainFilters config={config} {...props} onStatusChange={onStatusChange ? value => onStatusChange(value as ContractStatus | '') : undefined}/>; }
