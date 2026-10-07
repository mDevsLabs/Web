import { type DomainFrameProps } from '../../internal/domain.js';
import type { Document } from './types.js';
export interface DocumentCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Document;
}
export declare function DocumentCard(props: DocumentCardProps): import("react").JSX.Element;
