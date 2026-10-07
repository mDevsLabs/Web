// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { KnowledgeArticle, KnowledgeArticleStatus, KnowledgeArticleActivity, KnowledgeArticleMetric, KnowledgeArticleSettingsValues } from './types.js';
export interface KnowledgeArticleSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: KnowledgeArticleSettingsValues;
    onChange: (key: keyof KnowledgeArticleSettingsValues, value: boolean) => void;
}
export function KnowledgeArticleSettings({ onChange, ...props }: KnowledgeArticleSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof KnowledgeArticleSettingsValues, value)}/>; }
