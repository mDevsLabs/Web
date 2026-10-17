// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Project, ProjectStatus, ProjectActivity, ProjectMetric, ProjectSettingsValues } from './types.js';
export interface ProjectListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Project[];
    onSelect?: (item: Project) => void;
    emptyMessage?: string;
}
export function ProjectList({ onSelect, ...props }: ProjectListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Project) : undefined}/>; }
