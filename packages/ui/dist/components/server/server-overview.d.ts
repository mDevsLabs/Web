import { type DomainFrameProps } from '../../internal/domain.js';
import type { Server, ServerMetric } from './types.js';
export interface ServerOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Server[];
    metrics: readonly ServerMetric[];
}
export declare function ServerOverview(props: ServerOverviewProps): import("react").JSX.Element;
