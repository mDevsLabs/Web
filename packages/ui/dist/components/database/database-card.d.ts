import { type DomainFrameProps } from '../../internal/domain.js';
import type { Database } from './types.js';
export interface DatabaseCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Database;
}
export declare function DatabaseCard(props: DatabaseCardProps): import("react").JSX.Element;
