import { type DomainFrameProps } from '../../internal/domain.js';
import type { KnowledgeArticle } from './types.js';
export interface KnowledgeArticleFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<KnowledgeArticle>;
    onSubmit: (value: Omit<KnowledgeArticle, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function KnowledgeArticleForm({ onSubmit, ...props }: KnowledgeArticleFormProps): import("react").JSX.Element;
