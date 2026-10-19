import { type DomainFrameProps } from '../../internal/domain.js';
import type { Workspace } from './types.js';
export interface WorkspaceCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Workspace;
}
export declare function WorkspaceCard(props: WorkspaceCardProps): import("react").JSX.Element;
