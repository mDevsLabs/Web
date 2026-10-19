// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainOverview, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Quote, QuoteStatus, QuoteActivity, QuoteMetric, QuoteSettingsValues } from './types.js';
export interface QuoteOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Quote[];
    metrics: readonly QuoteMetric[];
}
export function QuoteOverview(props: QuoteOverviewProps) { return <DomainOverview config={config} {...props}/>; }
