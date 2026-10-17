import { type DomainFrameProps } from '../../internal/domain.js';
import type { FeatureFlagActivity } from './types.js';
export interface FeatureFlagTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly FeatureFlagActivity[];
    emptyMessage?: string;
}
export declare function FeatureFlagTimeline(props: FeatureFlagTimelineProps): import("react").JSX.Element;
