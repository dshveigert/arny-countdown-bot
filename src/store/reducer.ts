import {COUNTDOWN_LIST, NEW_COUNTDOWN_CREATION_PROCESS, NEW_COUNTDOWN_CREATION_PROCESS_COMPLETED} from "./action-types";
import {EQueue, ICtdnList, INewCtdnList} from "../intrafaces/countdown";
import {NewCtdnTypes} from "./actions";

const queue = [EQueue.START, EQueue.TITLE, EQueue.YEAR, EQueue.MONTH, EQueue.DAY, EQueue.TIME, EQueue.END];
const initialState = {
    newCountdownStartedList: {} as INewCtdnList,
    countdownList: {} as ICtdnList
};

function countdown(state = initialState, action: NewCtdnTypes) {
    switch (action.type) {
        case NEW_COUNTDOWN_CREATION_PROCESS:
            const update = {
                ...state.newCountdownStartedList,
                [action.payload.id]: {
                    queue: action.payload.queue,
                    data: {
                        ...state.newCountdownStartedList[action.payload.id]?.data,
                        ...action.payload.data,
                    }

                }
            }
            return {...state, newCountdownStartedList: update};

        case NEW_COUNTDOWN_CREATION_PROCESS_COMPLETED:
            const updateNew = {
                ...state.newCountdownStartedList,
                [action.payload.id]: {
                    queue: EQueue.NOT_STARTED,
                    data: {}
                }
            };
            const updateList = state.countdownList[action.payload.id] ? {
                ...state.countdownList,
                [action.payload.id]: {
                    ...state.countdownList[action.payload.id],
                    [action.payload.name]: state.newCountdownStartedList[action.payload.id].data
                }
            } : {
                ...state.countdownList,
                [action.payload.id]: {[action.payload.name]: state.newCountdownStartedList[action.payload.id].data}
            }
            return {...state, newCountdownStartedList: updateNew, countdownList: updateList};

        case COUNTDOWN_LIST:
            return {
                ...state,
                countdownList: {
                    ...state.countdownList,
                    [action.payload.id]: action.payload.data
                }};

        default:
            return state;
    }
}

export {
    countdown,
    queue
}
