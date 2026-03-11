export interface QueryNode {
    key: string;
    type: 'GROUP' | 'LEAF';
    operator?: 'AND' | 'OR' | 'NOT';
    text?: string;
    exact?: boolean;
    children?: QueryNode[];
}
