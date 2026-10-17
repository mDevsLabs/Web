import { type DomainFrameProps } from '../../internal/domain.js';
import type { AccessTokenMetric } from './types.js';
export interface AccessTokenStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly AccessTokenMetric[];
}
export declare function AccessTokenStats(props: AccessTokenStatsProps): import("react").JSX.Element;
