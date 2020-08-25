import TelegramBot, {Message} from 'node-telegram-bot-api';
import {store} from './store/store';

import * as config from "./config.json";
import {monthButton, newCountdownButton, yearsButton, getDaysButton, completeButton} from "./utils/buttons";
import {EActions, EBotCommands} from "./intrafaces/bot";
import {newCountdown, newCountdownCreated, updateCountdownList} from './store/actions';
import {EQueue} from "./intrafaces/countdown";
import {getId, getDaysInMonth, getCountdownList, countdownListString, objectSort} from './utils/bot-tools';
import {queue} from "./store/reducer";

const bot = new TelegramBot(config.telegram_bot.token, {polling: true});
bot.on("polling_error", (err: any) => err ? console.log(err) : console.log('No errors'));

bot.on('poll_answer', rr => {
    console.log('rr', rr);
})

// Handle callback queries
bot.on('callback_query', (callbackQuery) => {
    const action = callbackQuery.data;
    const msg = callbackQuery.message;

    if (msg) {
        const actionModified = action?.startsWith('year_')
            ? EActions.SET_YEAR
            : action?.startsWith('month_')
            ? EActions.SET_MONTH
            : action?.startsWith('day_')
            ? EActions.SET_DAY
            : action;

        const countdownOwnerId = getId({user: callbackQuery.from.id, chat: msg.chat.id});

        switch (actionModified) {
            case EActions.NEW_COUNTDOWN:
                // @ts-ignore
                store.dispatch(newCountdown(countdownOwnerId, EQueue.START, {}));
                bot.sendMessage(msg.chat.id, 'Tape the Countdowns title (Your goal, dreams, event or task).');
                break;
            case EActions.SET_YEAR:
                // @ts-ignore
                store.dispatch(newCountdown(countdownOwnerId, EQueue.YEAR, {year: Number(action?.replace('year_', ''))}));
                bot.sendMessage(msg.chat.id, 'Set the Month:', {
                    reply_markup: {
                        inline_keyboard: monthButton
                    }
                })
                break;
            case EActions.SET_MONTH:
                const month = action?.replace('month_', '') || '01';
                const year = store.getState().newCountdownStartedList[countdownOwnerId]?.data?.year;
                // @ts-ignore
                store.dispatch(newCountdown(countdownOwnerId, EQueue.MONTH, {month}));
                bot.sendMessage(msg.chat.id, 'Set the Day:', {
                    reply_markup: {
                        inline_keyboard: getDaysButton(getDaysInMonth(month, year))
                    }
                })
                break;
            case EActions.SET_DAY:
                // @ts-ignore
                store.dispatch(newCountdown(countdownOwnerId, EQueue.DAY, {day: action?.replace('day_', '')}));
                bot.sendMessage(msg.chat.id, 'Excellent! Countdown has been created. \nIt will remind you every day at 10:00 AM. \nIf you want to change time - write it in format *hh:mm*. If not - push the "Ok" button.', {parse_mode: 'HTML'}).then(_ => {
                    bot.sendMessage(msg.chat.id, 'Tape the time ( *hh:mm* ) or click "Ok".', {
                        reply_markup: {
                            inline_keyboard: completeButton
                        },
                        parse_mode: 'HTML'
                    })
                });
                break;
            case EActions.COMPLETE_CREATION:
                // @ts-ignore
                store.dispatch(newCountdown(countdownOwnerId, EQueue.END, {}));
                const title = store.getState().newCountdownStartedList[countdownOwnerId]?.data?.title;
                bot.sendMessage(msg.chat.id, `Countdown "${title}" fully created.`);
                // @ts-ignore
                store.dispatch(newCountdownCreated(countdownOwnerId));
                break;

            default:
                console.log('No ACTIONS ');
        }
        // console.log('\n \n store After Actions', JSON.stringify(store.getState()));
        // console.log('\n\n');
    } else {
        throw Error('[callback_query]');
    }
});

bot.on('message', (msg) => {
    // console.log('[Message type detected]', msg);
    const { newCountdownStartedList } = store.getState();
    const countdownOwnerId = getId(msg);
    if (newCountdownStartedList.hasOwnProperty(countdownOwnerId)) {
        const nextStep = queue.indexOf(newCountdownStartedList[countdownOwnerId].queue) + 1;
        if (queue[nextStep] === EQueue.TITLE) {
            const data = {
                [queue[nextStep]]: msg.text,
                created: msg.date,
                updated: msg.date,
                notification_time: '10:00',
                ownerId: countdownOwnerId,
                complete: false,
                main_event: '',
            };
            // @ts-ignore
            store.dispatch(newCountdown(getId(msg), queue[nextStep] as EQueue, data));
            bot.sendMessage(msg.chat.id, 'Now it is necessary to set the date of your goal.').then(_ => {
                bot.sendMessage(msg.chat.id, 'First, set the Year:', {
                    reply_markup: {
                        inline_keyboard: yearsButton
                    }
                })
            });
        }
    }
    if (msg && msg.entities && msg.entities[0].type === 'bot_command') {
        const command = msg.text;

        switch (command) {
            case EBotCommands.START:
                getCountdownList(countdownOwnerId).then(result => {
                    if (result && Object.keys(result).length > 0) {
                        const sorted = objectSort(result);
                        // @ts-ignore
                        store.dispatch(updateCountdownList(countdownOwnerId, sorted));
                    }
                });
                bot.sendMessage(msg.chat.id, 'Lets start creating your new Countdown.', {
                    reply_markup: {
                        inline_keyboard: [newCountdownButton]
                    }
                });
                break;
            case EBotCommands.GET_LIST:
                getCountdownList(countdownOwnerId).then(result => {
                    if (result && Object.keys(result).length === 0) {
                        bot.sendMessage(msg.chat.id, 'There are no Countdowns. Create new: /start');
                    } else {
                        const sorted = objectSort(result);
                        // @ts-ignore
                        store.dispatch(updateCountdownList(countdownOwnerId, sorted));
                        // console.log('[Final reducer]', JSON.stringify(store.getState()));
                        let listString = 'List of your current Countdowns: \n';
                        for (let key in sorted) {
                            listString += countdownListString(sorted[key]) + '\n';
                        }
                        bot.sendMessage(msg.chat.id, listString, {
                            parse_mode: 'HTML'
                        })
                    }
                })
                break;
            case EBotCommands.GET_LIST_COMPLETED:
                getCountdownList(countdownOwnerId, true).then(result => {
                    const sorted = objectSort(result);
                    if (result && Object.keys(result).length === 0) {
                        bot.sendMessage(msg.chat.id, 'There are no completed Countdowns.');
                    } else {
                        // @ts-ignore
                        store.dispatch(updateCountdownList(countdownOwnerId, sorted));
                        // console.log('[Final reducer]', JSON.stringify(store.getState()));
                        let listString = 'List of your completed Countdowns: \n';
                        for (let key in sorted) {
                            listString += countdownListString(sorted[key]) + '\n';
                        }
                        bot.sendMessage(msg.chat.id, listString, {
                            parse_mode: 'HTML'
                        })
                    }
                })
                break;
        }
    }
});
//
// function intervalFunc() {
//
// }
// setInterval(intervalFunc, config.tick_interval * 1000);
