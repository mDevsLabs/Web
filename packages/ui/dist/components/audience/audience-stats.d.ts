import { type DomainFrameProps } from '../../internal/domain.js';
import type { AudienceMetric } from './types.js';
export interface AudienceStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly AudienceMetric[];
}
export declare function AudienceStats(props: AudienceStatsProps): import("react").JSX.Element;
