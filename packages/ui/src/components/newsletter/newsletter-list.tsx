// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Newsletter, NewsletterStatus, NewsletterActivity, NewsletterMetric, NewsletterSettingsValues } from './types.js';
export interface NewsletterListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Newsletter[];
    onSelect?: (item: Newsletter) => void;
    emptyMessage?: string;
}
export function NewsletterList({ onSelect, ...props }: NewsletterListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Newsletter) : undefined}/>; }
