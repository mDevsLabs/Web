// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainStats, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Template, TemplateStatus, TemplateActivity, TemplateMetric, TemplateSettingsValues } from './types.js';
export interface TemplateStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly TemplateMetric[];
}
export function TemplateStats(props: TemplateStatsProps) { return <DomainStats config={config} {...props}/>; }
