import { type DomainFrameProps } from '../../internal/domain.js';
import type { DatabaseMetric } from './types.js';
export interface DatabaseStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly DatabaseMetric[];
}
export declare function DatabaseStats(props: DatabaseStatsProps): import("react").JSX.Element;
