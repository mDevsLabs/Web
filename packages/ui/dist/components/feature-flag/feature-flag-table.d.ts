import { type DomainFrameProps } from '../../internal/domain.js';
import type { FeatureFlag } from './types.js';
export interface FeatureFlagTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly FeatureFlag[];
    emptyMessage?: string;
}
export declare function FeatureFlagTable(props: FeatureFlagTableProps): import("react").JSX.Element;
