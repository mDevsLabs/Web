// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainStats, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Project, ProjectStatus, ProjectActivity, ProjectMetric, ProjectSettingsValues } from './types.js';
export interface ProjectStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly ProjectMetric[];
}
export function ProjectStats(props: ProjectStatsProps) { return <DomainStats config={config} {...props}/>; }
