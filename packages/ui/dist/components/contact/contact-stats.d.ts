import { type DomainFrameProps } from '../../internal/domain.js';
import type { ContactMetric } from './types.js';
export interface ContactStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly ContactMetric[];
}
export declare function ContactStats(props: ContactStatsProps): import("react").JSX.Element;
