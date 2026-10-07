import { type DomainFrameProps } from '../../internal/domain.js';
import type { Team, TeamMetric } from './types.js';
export interface TeamOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Team[];
    metrics: readonly TeamMetric[];
}
export declare function TeamOverview(props: TeamOverviewProps): import("react").JSX.Element;
