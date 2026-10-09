import { type DomainFrameProps } from '../../internal/domain.js';
import type { Folder } from './types.js';
export interface FolderCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Folder;
}
export declare function FolderCard(props: FolderCardProps): import("react").JSX.Element;
