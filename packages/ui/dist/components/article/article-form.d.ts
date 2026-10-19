import { type DomainFrameProps } from '../../internal/domain.js';
import type { Article } from './types.js';
export interface ArticleFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Article>;
    onSubmit: (value: Omit<Article, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function ArticleForm({ onSubmit, ...props }: ArticleFormProps): import("react").JSX.Element;
