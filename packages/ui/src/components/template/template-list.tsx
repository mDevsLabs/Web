// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Template, TemplateStatus, TemplateActivity, TemplateMetric, TemplateSettingsValues } from './types.js';
export interface TemplateListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Template[];
    onSelect?: (item: Template) => void;
    emptyMessage?: string;
}
export function TemplateList({ onSelect, ...props }: TemplateListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Template) : undefined}/>; }
