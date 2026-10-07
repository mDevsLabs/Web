// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Board, BoardStatus, BoardActivity, BoardMetric, BoardSettingsValues } from './types.js';
export interface BoardSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: BoardSettingsValues;
    onChange: (key: keyof BoardSettingsValues, value: boolean) => void;
}
export function BoardSettings({ onChange, ...props }: BoardSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof BoardSettingsValues, value)}/>; }
