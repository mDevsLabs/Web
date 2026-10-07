// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Board, BoardStatus, BoardActivity, BoardMetric, BoardSettingsValues } from './types.js';
export interface BoardFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Board>;
    onSubmit: (value: Omit<Board, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function BoardForm({ onSubmit, ...props }: BoardFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Board, 'id'>)}/>; }
