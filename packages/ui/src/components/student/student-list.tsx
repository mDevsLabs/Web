// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Student, StudentStatus, StudentActivity, StudentMetric, StudentSettingsValues } from './types.js';
export interface StudentListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Student[];
    onSelect?: (item: Student) => void;
    emptyMessage?: string;
}
export function StudentList({ onSelect, ...props }: StudentListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Student) : undefined}/>; }
