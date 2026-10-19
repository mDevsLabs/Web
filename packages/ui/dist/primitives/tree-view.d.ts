export interface TreeNode {
    id: string;
    label: string;
    children?: readonly TreeNode[];
}
export interface TreeViewProps {
    nodes: readonly TreeNode[];
    onSelect?: (node: TreeNode) => void;
    label: string;
}
export declare function TreeView({ nodes, onSelect, label }: TreeViewProps): import("react").JSX.Element;
