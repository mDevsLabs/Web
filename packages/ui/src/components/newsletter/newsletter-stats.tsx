// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainStats, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Newsletter, NewsletterStatus, NewsletterActivity, NewsletterMetric, NewsletterSettingsValues } from './types.js';
export interface NewsletterStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly NewsletterMetric[];
}
export function NewsletterStats(props: NewsletterStatsProps) { return <DomainStats config={config} {...props}/>; }
