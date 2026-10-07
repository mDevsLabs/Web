import { type DomainFrameProps } from '../../internal/domain.js';
import type { BoardMetric } from './types.js';
export interface BoardStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly BoardMetric[];
}
export declare function BoardStats(props: BoardStatsProps): import("react").JSX.Element;
