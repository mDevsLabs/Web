import { type DomainFrameProps } from '../../internal/domain.js';
import type { MediaAsset } from './types.js';
export interface MediaAssetCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: MediaAsset;
}
export declare function MediaAssetCard(props: MediaAssetCardProps): import("react").JSX.Element;
