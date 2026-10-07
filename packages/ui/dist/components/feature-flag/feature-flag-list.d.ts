import { type DomainFrameProps } from '../../internal/domain.js';
import type { FeatureFlag } from './types.js';
export interface FeatureFlagListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly FeatureFlag[];
    onSelect?: (item: FeatureFlag) => void;
    emptyMessage?: string;
}
export declare function FeatureFlagList({ onSelect, ...props }: FeatureFlagListProps): import("react").JSX.Element;
