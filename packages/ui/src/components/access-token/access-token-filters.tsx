// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainFilters, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { AccessToken, AccessTokenStatus, AccessTokenActivity, AccessTokenMetric, AccessTokenSettingsValues } from './types.js';
export interface AccessTokenFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: AccessTokenStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: AccessTokenStatus | '') => void;
}
export function AccessTokenFilters({ onStatusChange, ...props }: AccessTokenFiltersProps) { return <DomainFilters config={config} {...props} onStatusChange={onStatusChange ? value => onStatusChange(value as AccessTokenStatus | '') : undefined}/>; }
