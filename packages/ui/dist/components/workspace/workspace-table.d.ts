import { type DomainFrameProps } from '../../internal/domain.js';
import type { Workspace } from './types.js';
export interface WorkspaceTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Workspace[];
    emptyMessage?: string;
}
export declare function WorkspaceTable(props: WorkspaceTableProps): import("react").JSX.Element;
