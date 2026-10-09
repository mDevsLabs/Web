// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTimeline, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Project, ProjectStatus, ProjectActivity, ProjectMetric, ProjectSettingsValues } from './types.js';
export interface ProjectTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly ProjectActivity[];
    emptyMessage?: string;
}
export function ProjectTimeline(props: ProjectTimelineProps) { return <DomainTimeline config={config} {...props}/>; }
