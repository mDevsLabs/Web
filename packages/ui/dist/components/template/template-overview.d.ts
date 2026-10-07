import { type DomainFrameProps } from '../../internal/domain.js';
import type { Template, TemplateMetric } from './types.js';
export interface TemplateOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Template[];
    metrics: readonly TemplateMetric[];
}
export declare function TemplateOverview(props: TemplateOverviewProps): import("react").JSX.Element;
