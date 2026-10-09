// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Comment, CommentStatus, CommentActivity, CommentMetric, CommentSettingsValues } from './types.js';
export interface CommentSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: CommentSettingsValues;
    onChange: (key: keyof CommentSettingsValues, value: boolean) => void;
}
export function CommentSettings({ onChange, ...props }: CommentSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof CommentSettingsValues, value)}/>; }
