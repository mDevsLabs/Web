// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Audience, AudienceStatus, AudienceActivity, AudienceMetric, AudienceSettingsValues } from './types.js';
export interface AudienceListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Audience[];
    onSelect?: (item: Audience) => void;
    emptyMessage?: string;
}
export function AudienceList({ onSelect, ...props }: AudienceListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Audience) : undefined}/>; }
