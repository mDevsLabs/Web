import { type DomainFrameProps } from '../../internal/domain.js';
import type { AccessToken } from './types.js';
export interface AccessTokenTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly AccessToken[];
    emptyMessage?: string;
}
export declare function AccessTokenTable(props: AccessTokenTableProps): import("react").JSX.Element;
