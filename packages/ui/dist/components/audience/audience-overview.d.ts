import { type DomainFrameProps } from '../../internal/domain.js';
import type { Audience, AudienceMetric } from './types.js';
export interface AudienceOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Audience[];
    metrics: readonly AudienceMetric[];
}
export declare function AudienceOverview(props: AudienceOverviewProps): import("react").JSX.Element;
