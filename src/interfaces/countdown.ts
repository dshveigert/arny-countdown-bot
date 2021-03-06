export type IOwnerIDType = string;

export interface INewCtdnList {
    [ownerId: string]: {
        queue: EQueue,
        data: ICtdn
    }
}

export interface ICtdnList {
    [ownerId: string]: ICtdnItem
}

export interface ICtdnItem {
    [key: string]: ICtdn
}

export interface ICtdn {
    ownerId: IOwnerIDType,
    title: string,
    year: number,
    month: number,
    day: number,
    time: string,
    created: number | string,
    updated: number | string,
    main_event: IOwnerIDType,
    complete: boolean
    id?: string,
    updated_date_time?: string,
    created_date_time?: string,
};

export enum EQueue {
    NOT_STARTED = 'not_started',
    START = 'start',
    TITLE = 'title',
    YEAR = 'year',
    MONTH = 'month',
    DAY = 'day',
    TIME = 'time',
    END = 'end'
}

export interface IScheduleList {
    [ownerId: string]: IScheduleItem
}

export interface IScheduleItem {
    [key: string]: ISchedule
}

export interface ISchedule {
    id: string,
    time: ITime,
    date: string,
    last_sended_date?: number,
    last_Sended_date_time?: string
}

export interface ITime {
    h: number,
    m: number,
    zone?: string
}
