// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainCard, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Contact, ContactStatus, ContactActivity, ContactMetric, ContactSettingsValues } from './types.js';
export interface ContactCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Contact;
}
export function ContactCard(props: ContactCardProps) { return <DomainCard config={config} {...props}/>; }
