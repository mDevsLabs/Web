import { type DomainFrameProps } from '../../internal/domain.js';
import type { Environment } from './types.js';
export interface EnvironmentTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Environment[];
    emptyMessage?: string;
}
export declare function EnvironmentTable(props: EnvironmentTableProps): import("react").JSX.Element;
