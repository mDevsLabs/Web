import { type DomainFrameProps } from '../../internal/domain.js';
import type { Folder } from './types.js';
export interface FolderListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Folder[];
    onSelect?: (item: Folder) => void;
    emptyMessage?: string;
}
export declare function FolderList({ onSelect, ...props }: FolderListProps): import("react").JSX.Element;
