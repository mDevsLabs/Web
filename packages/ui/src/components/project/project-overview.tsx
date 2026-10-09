// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainOverview, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Project, ProjectStatus, ProjectActivity, ProjectMetric, ProjectSettingsValues } from './types.js';
export interface ProjectOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Project[];
    metrics: readonly ProjectMetric[];
}
export function ProjectOverview(props: ProjectOverviewProps) { return <DomainOverview config={config} {...props}/>; }
