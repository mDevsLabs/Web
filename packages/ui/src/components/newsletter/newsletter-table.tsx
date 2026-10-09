// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTable, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Newsletter, NewsletterStatus, NewsletterActivity, NewsletterMetric, NewsletterSettingsValues } from './types.js';
export interface NewsletterTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Newsletter[];
    emptyMessage?: string;
}
export function NewsletterTable(props: NewsletterTableProps) { return <DomainTable config={config} {...props}/>; }
