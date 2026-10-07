import { type DomainFrameProps } from '../../internal/domain.js';
import type { Release, ReleaseMetric } from './types.js';
export interface ReleaseOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Release[];
    metrics: readonly ReleaseMetric[];
}
export declare function ReleaseOverview(props: ReleaseOverviewProps): import("react").JSX.Element;
