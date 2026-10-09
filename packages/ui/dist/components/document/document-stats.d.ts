import { type DomainFrameProps } from '../../internal/domain.js';
import type { DocumentMetric } from './types.js';
export interface DocumentStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly DocumentMetric[];
}
export declare function DocumentStats(props: DocumentStatsProps): import("react").JSX.Element;
