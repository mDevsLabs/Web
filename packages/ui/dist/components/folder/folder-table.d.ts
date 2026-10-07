import { type DomainFrameProps } from '../../internal/domain.js';
import type { Folder } from './types.js';
export interface FolderTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Folder[];
    emptyMessage?: string;
}
export declare function FolderTable(props: FolderTableProps): import("react").JSX.Element;
