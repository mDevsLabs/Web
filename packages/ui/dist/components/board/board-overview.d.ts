import { type DomainFrameProps } from '../../internal/domain.js';
import type { Board, BoardMetric } from './types.js';
export interface BoardOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Board[];
    metrics: readonly BoardMetric[];
}
export declare function BoardOverview(props: BoardOverviewProps): import("react").JSX.Element;
