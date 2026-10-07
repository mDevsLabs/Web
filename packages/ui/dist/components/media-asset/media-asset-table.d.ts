import { type DomainFrameProps } from '../../internal/domain.js';
import type { MediaAsset } from './types.js';
export interface MediaAssetTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly MediaAsset[];
    emptyMessage?: string;
}
export declare function MediaAssetTable(props: MediaAssetTableProps): import("react").JSX.Element;
