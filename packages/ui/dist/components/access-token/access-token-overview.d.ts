import { type DomainFrameProps } from '../../internal/domain.js';
import type { AccessToken, AccessTokenMetric } from './types.js';
export interface AccessTokenOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly AccessToken[];
    metrics: readonly AccessTokenMetric[];
}
export declare function AccessTokenOverview(props: AccessTokenOverviewProps): import("react").JSX.Element;
