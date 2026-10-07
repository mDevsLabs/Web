// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainOverview, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Contact, ContactStatus, ContactActivity, ContactMetric, ContactSettingsValues } from './types.js';
export interface ContactOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Contact[];
    metrics: readonly ContactMetric[];
}
export function ContactOverview(props: ContactOverviewProps) { return <DomainOverview config={config} {...props}/>; }
