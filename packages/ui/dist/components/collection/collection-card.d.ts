import { type DomainFrameProps } from '../../internal/domain.js';
import type { Collection } from './types.js';
export interface CollectionCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Collection;
}
export declare function CollectionCard(props: CollectionCardProps): import("react").JSX.Element;
