import { type DomainFrameProps } from '../../internal/domain.js';
import type { RepositoryMetric } from './types.js';
export interface RepositoryStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly RepositoryMetric[];
}
export declare function RepositoryStats(props: RepositoryStatsProps): import("react").JSX.Element;
