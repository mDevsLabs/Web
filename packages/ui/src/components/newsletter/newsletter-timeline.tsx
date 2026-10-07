// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTimeline, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Newsletter, NewsletterStatus, NewsletterActivity, NewsletterMetric, NewsletterSettingsValues } from './types.js';
export interface NewsletterTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly NewsletterActivity[];
    emptyMessage?: string;
}
export function NewsletterTimeline(props: NewsletterTimelineProps) { return <DomainTimeline config={config} {...props}/>; }
