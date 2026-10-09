import { type DomainFrameProps } from '../../internal/domain.js';
import type { Database, DatabaseMetric } from './types.js';
export interface DatabaseOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Database[];
    metrics: readonly DatabaseMetric[];
}
export declare function DatabaseOverview(props: DatabaseOverviewProps): import("react").JSX.Element;
