// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Roadmap, RoadmapStatus, RoadmapActivity, RoadmapMetric, RoadmapSettingsValues } from './types.js';
export interface RoadmapFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Roadmap>;
    onSubmit: (value: Omit<Roadmap, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function RoadmapForm({ onSubmit, ...props }: RoadmapFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Roadmap, 'id'>)}/>; }
