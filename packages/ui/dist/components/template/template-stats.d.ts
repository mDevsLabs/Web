import { type DomainFrameProps } from '../../internal/domain.js';
import type { TemplateMetric } from './types.js';
export interface TemplateStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly TemplateMetric[];
}
export declare function TemplateStats(props: TemplateStatsProps): import("react").JSX.Element;
