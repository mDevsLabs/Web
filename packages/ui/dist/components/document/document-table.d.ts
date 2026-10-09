import { type DomainFrameProps } from '../../internal/domain.js';
import type { Document } from './types.js';
export interface DocumentTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Document[];
    emptyMessage?: string;
}
export declare function DocumentTable(props: DocumentTableProps): import("react").JSX.Element;
