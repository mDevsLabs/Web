import { type DomainFrameProps } from '../../internal/domain.js';
import type { Workspace } from './types.js';
export interface WorkspaceListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Workspace[];
    onSelect?: (item: Workspace) => void;
    emptyMessage?: string;
}
export declare function WorkspaceList({ onSelect, ...props }: WorkspaceListProps): import("react").JSX.Element;
