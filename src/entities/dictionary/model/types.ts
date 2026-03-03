export interface DictionaryItem {
    id: string;
    name: string;
}

export interface AreaItem extends DictionaryItem {
    parent_id?: string | null;
    areas?: AreaItem[];
}

export interface ProfessionalRoleCategory {
    id: string;
    name: string;
    roles: DictionaryItem[];
}

export interface StaticDictionariesResponse {
    areas?: AreaItem[];
    professional_roles?: ProfessionalRoleCategory[];
    skills?: DictionaryItem[];
    industries?: any[];
    languages?: any[];
}
