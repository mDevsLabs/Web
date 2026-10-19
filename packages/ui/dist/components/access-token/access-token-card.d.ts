import { type DomainFrameProps } from '../../internal/domain.js';
import type { AccessToken } from './types.js';
export interface AccessTokenCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: AccessToken;
}
export declare function AccessTokenCard(props: AccessTokenCardProps): import("react").JSX.Element;
