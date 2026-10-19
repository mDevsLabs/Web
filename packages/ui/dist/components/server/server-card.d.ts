import { type DomainFrameProps } from '../../internal/domain.js';
import type { Server } from './types.js';
export interface ServerCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Server;
}
export declare function ServerCard(props: ServerCardProps): import("react").JSX.Element;
