import { type DomainFrameProps } from '../../internal/domain.js';
import type { Board } from './types.js';
export interface BoardFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Board>;
    onSubmit: (value: Omit<Board, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function BoardForm({ onSubmit, ...props }: BoardFormProps): import("react").JSX.Element;
