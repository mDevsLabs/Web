import { type DomainFrameProps } from '../../internal/domain.js';
import type { AccessToken } from './types.js';
export interface AccessTokenListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly AccessToken[];
    onSelect?: (item: AccessToken) => void;
    emptyMessage?: string;
}
export declare function AccessTokenList({ onSelect, ...props }: AccessTokenListProps): import("react").JSX.Element;
