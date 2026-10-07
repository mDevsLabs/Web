// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainCard, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Template, TemplateStatus, TemplateActivity, TemplateMetric, TemplateSettingsValues } from './types.js';
export interface TemplateCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Template;
}
export function TemplateCard(props: TemplateCardProps) { return <DomainCard config={config} {...props}/>; }
