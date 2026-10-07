import { type DomainFrameProps } from '../../internal/domain.js';
import type { MediaAsset } from './types.js';
export interface MediaAssetListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly MediaAsset[];
    onSelect?: (item: MediaAsset) => void;
    emptyMessage?: string;
}
export declare function MediaAssetList({ onSelect, ...props }: MediaAssetListProps): import("react").JSX.Element;
