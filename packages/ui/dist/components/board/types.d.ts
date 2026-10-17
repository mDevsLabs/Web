import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Board = {
    id?: string;
    name: string;
    owner: string;
    columnCount: number;
    cardCount: number;
    status: "active" | "private" | "archived";
};
export type BoardStatus = Board['status'];
export interface BoardActivity extends DomainActivity {
    boardId?: string;
}
export type BoardMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalBoard' | 'activeBoard' | 'valueBoard';
};
export type BoardSettingsValues = Partial<Record<"notifyBoard" | "archiveBoard" | "approveBoard", boolean>>;
