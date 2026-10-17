// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Article, ArticleStatus, ArticleActivity, ArticleMetric, ArticleSettingsValues } from './types.js';
export interface ArticleSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: ArticleSettingsValues;
    onChange: (key: keyof ArticleSettingsValues, value: boolean) => void;
}
export function ArticleSettings({ onChange, ...props }: ArticleSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof ArticleSettingsValues, value)}/>; }
