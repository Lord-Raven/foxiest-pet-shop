import {ReactElement} from "react";
import {StageBase, StageResponse, InitialData, Message} from "@chub-ai/stages-ts";
import {LoadResponse} from "@chub-ai/stages-ts/dist/types/load";
import { PixiAvatarView } from "./characters/PixiAvatarView";

type MessageStateType = any;

type ConfigType = any;

type InitStateType = any;

type ChatStateType = any;

export class Stage extends StageBase<InitStateType, ChatStateType, MessageStateType, ConfigType> {

    constructor(data: InitialData<InitStateType, ChatStateType, MessageStateType, ConfigType>) {
        super(data);
        const {
            characters,         // @type:  { [key: string]: Character }
            users,                  // @type:  { [key: string]: User}
            config,                                 //  @type:  ConfigType
            messageState,                           //  @type:  MessageStateType
            environment,                     // @type: Environment (which is a string)
            initState,                             // @type: null | InitStateType
            chatState                              // @type: null | ChatStateType
        } = data;
    }

    async load(): Promise<Partial<LoadResponse<InitStateType, ChatStateType, MessageStateType>>> {

        return {
            success: true,
            error: null,
            initState: null,
            chatState: null,
        };
    }

    async setState(state: MessageStateType): Promise<void> {}

    async beforePrompt(userMessage: Message): Promise<Partial<StageResponse<ChatStateType, MessageStateType>>> {return {};}

    async afterResponse(botMessage: Message): Promise<Partial<StageResponse<ChatStateType, MessageStateType>>> {return {};}


    render(): ReactElement {
        return <div style={{
            width: '100%',
            height: '100vh',
            display: 'grid',
            alignItems: 'stretch'
        }}>
            <PixiAvatarView />
        </div>;
    }

}
