import { type DomainFrameProps } from '../../internal/domain.js';
import type { KnowledgeArticleSettingsValues } from './types.js';
export interface KnowledgeArticleSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: KnowledgeArticleSettingsValues;
    onChange: (key: keyof KnowledgeArticleSettingsValues, value: boolean) => void;
}
export declare function KnowledgeArticleSettings({ onChange, ...props }: KnowledgeArticleSettingsProps): import("react").JSX.Element;
