import { type DomainFrameProps } from '../../internal/domain.js';
import type { Template } from './types.js';
export interface TemplateTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Template[];
    emptyMessage?: string;
}
export declare function TemplateTable(props: TemplateTableProps): import("react").JSX.Element;
