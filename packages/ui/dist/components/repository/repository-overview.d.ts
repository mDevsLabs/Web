import { type DomainFrameProps } from '../../internal/domain.js';
import type { Repository, RepositoryMetric } from './types.js';
export interface RepositoryOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Repository[];
    metrics: readonly RepositoryMetric[];
}
export declare function RepositoryOverview(props: RepositoryOverviewProps): import("react").JSX.Element;
