// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { AccessToken, AccessTokenStatus, AccessTokenActivity, AccessTokenMetric, AccessTokenSettingsValues } from './types.js';
export interface AccessTokenListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly AccessToken[];
    onSelect?: (item: AccessToken) => void;
    emptyMessage?: string;
}
export function AccessTokenList({ onSelect, ...props }: AccessTokenListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as AccessToken) : undefined}/>; }
