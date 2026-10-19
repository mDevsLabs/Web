import { type DomainFrameProps } from '../../internal/domain.js';
import type { FeatureFlag } from './types.js';
export interface FeatureFlagCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: FeatureFlag;
}
export declare function FeatureFlagCard(props: FeatureFlagCardProps): import("react").JSX.Element;
