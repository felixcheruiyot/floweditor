import { languageToAsset } from '~/components/flow/actions/updatecontact/helpers';
import { exit } from '~/components/flow/exit/Exit.scss';
import { determineTypeConfig } from '~/components/flow/helpers';
import { ActionFormProps, RouterFormProps } from '~/components/flow/props';
import { CaseProps } from '~/components/flow/routers/caselist/CaseList';
import { DefaultExitNames } from '~/components/flow/routers/constants';
import { CategorizedCases, resolveRoutes } from '~/components/flow/routers/helpers';
import { Methods } from '~/components/flow/routers/webhook/helpers';
import { DEFAULT_OPERAND } from '~/components/nodeeditor/constants';
import { Operators, Types } from '~/config/interfaces';
import { getTypeConfig } from '~/config/typeConfigs';
import {
    AnyAction,
    BroadcastMsg,
    CallResthook,
    CallWebhook,
    Case,
    Category,
    ChangeGroups,
    Contact,
    Exit,
    Field,
    Flow,
    FlowNode,
    Group,
    Label,
    PlayAudio,
    RemoveFromGroups,
    Router,
    RouterTypes,
    SayMsg,
    SendEmail,
    SendMsg,
    SetContactChannel,
    SetContactField,
    SetContactLanguage,
    SetContactProperty,
    SetRunResult,
    StartFlow,
    StartFlowArgs,
    StartFlowExitNames,
    StartSession,
    SwitchRouter,
    TransferAirtime,
    UINode,
    Wait,
    WaitTypes,
    WebhookExitNames
} from '~/flowTypes';
import { Assets, AssetType, RenderNode } from '~/store/flowContext';
import { assetListToMap } from '~/store/helpers';
import { mock } from '~/testUtils';
import * as utils from '~/utils';

const { results: groupsResults } = require('~/test/assets/groups.json');
const languagesResults = require('~/test/assets/languages.json');
mock(utils, 'createUUID', utils.seededUUIDs());
/**
 * Create a select control option
 */
export const createSelectOption = ({ label }: { label: string }) => ({
    label: utils.capitalize(label.trim()),
    labelKey: 'name',
    valueKey: 'id'
});

export const createSayMsgAction = ({
    uuid = utils.createUUID(),
    text = 'Welcome to Moviefone!'
}: {
    uuid?: string;
    text?: string;
} = {}): SayMsg => ({
    type: Types.say_msg,
    uuid,
    text
});

export const createPlayAudioAction = ({
    uuid = utils.createUUID(),
    audio_url = '/my_audio.mp3'
}: {
    uuid?: string;
    text?: string;
    audio_url?: string;
} = {}): PlayAudio => ({
    type: Types.play_audio,
    uuid,
    audio_url
});

export const createSendMsgAction = ({
    uuid = utils.createUUID(),
    text = 'Hey!',
    all_urns = false
}: {
    uuid?: string;
    text?: string;
    // tslint:disable-next-line:variable-name
    all_urns?: boolean;
} = {}): SendMsg => ({
    type: Types.send_msg,
    uuid,
    text,
    all_urns
});

export const createSendEmailAction = ({
    uuid = utils.createUUID(),
    subject = 'New Sign Up',
    body = '@run.results.name just signed up.',
    addresses = ['jane@example.com']
}: {
    uuid?: string;
    subject?: string;
    body?: string;
    addresses?: string[];
} = {}): SendEmail => ({
    uuid,
    type: Types.send_email,
    subject,
    body,
    addresses
});

export const createTransferAirtimeAction = ({
    uuid = utils.createUUID()
}: {
    uuid?: string;
} = {}): TransferAirtime => ({
    uuid,
    type: Types.transfer_airtime,
    amounts: {
        USD: 1.5
    }
});

export const createCallResthookAction = ({
    uuid = utils.createUUID(),
    resthook = 'my-resthook'
}: {
    uuid?: string;
    resthook?: string;
} = {}): CallResthook => ({
    uuid,
    type: Types.call_resthook,
    resthook
});

export const createCallWebhookAction = ({
    uuid = utils.createUUID(),
    url = 'https://www.example.com',
    method = Methods.GET
}: {
    uuid?: string;
    url?: string;
    method?: Methods;
} = {}): CallWebhook => ({
    uuid,
    type: Types.call_webhook,
    url,
    method
});

export const createStartSessionAction = ({
    uuid = utils.createUUID(),
    groups = [
        { uuid: utils.createUUID(), name: 'Cat Fanciers' },
        { uuid: utils.createUUID(), name: 'Cat Facts' }
    ],
    contacts = [
        { uuid: utils.createUUID(), name: 'Kellan Alexander' },
        { uuid: utils.createUUID(), name: 'Norbert Kwizera' },
        { uuid: utils.createUUID(), name: 'Rowan Seymour' }
    ],
    flow = {
        uuid: 'flow_uuid',
        name: 'Flow to Start'
    }
}: {
    uuid?: string;
    groups?: Group[];
    contacts?: Contact[];
    flow?: Flow;
} = {}): StartSession => ({
    uuid,
    groups,
    contacts,
    flow,
    type: Types.start_session
});

export const createBroadcastMsgAction = ({
    uuid = utils.createUUID(),
    groups = [
        { uuid: utils.createUUID(), name: 'Cat Fanciers' },
        { uuid: utils.createUUID(), name: 'Cat Facts' }
    ],
    contacts = [
        { uuid: utils.createUUID(), name: 'Kellan Alexander' },
        { uuid: utils.createUUID(), name: 'Norbert Kwizera' },
        { uuid: utils.createUUID(), name: 'Rowan Seymour' }
    ],
    text = 'Hello World'
}: {
    uuid?: string;
    groups?: Group[];
    contacts?: Contact[];
    text?: string;
} = {}): BroadcastMsg => ({
    uuid,
    groups,
    contacts,
    text,
    type: Types.send_broadcast
});

export const createAddGroupsAction = ({
    uuid = utils.createUUID(),
    groups = groupsResults
}: { uuid?: string; groups?: Group[] } = {}): ChangeGroups => ({
    uuid,
    type: Types.add_contact_groups,
    groups
});

export const createRemoveGroupsAction = ({
    uuid = utils.createUUID(),
    groups = groupsResults
}: { uuid?: string; groups?: Group[] } = {}): RemoveFromGroups => ({
    uuid,
    all_groups: false,
    type: Types.remove_contact_groups,
    groups
});

export const createStartFlowAction = ({
    uuid = utils.createUUID(),
    flow = {
        name: 'Colors',
        uuid: 'd4a3a01c-1dee-4324-b107-4ac7a21d836f'
    }
}: {
    uuid?: string;
    flow?: {
        name: string;
        uuid: string;
    };
} = {}): StartFlow => ({
    type: Types.enter_flow,
    uuid: 'd4a3a01c-1dee-4324-b107-4ac7a21d836f',
    flow: {
        name: utils.capitalize(flow.name.trim()),
        uuid
    }
});

export const createSetContactNameAction = ({
    uuid = utils.createUUID(),
    name = 'Jane Goodall'
}: {
    uuid?: string;
    name?: string;
} = {}): SetContactProperty => ({
    uuid,
    name,
    type: Types.set_contact_name
});

export const createSetContactFieldAction = ({
    uuid = utils.createUUID(),
    field = {
        key: 'age',
        name: 'Age'
    },
    value = '25'
}: {
    uuid?: string;
    field?: Field;
    value?: string;
} = {}): SetContactField => ({
    uuid,
    field,
    value,
    type: Types.set_contact_field
});

export const createSetContactLanguageAction = ({
    uuid = utils.createUUID(),
    language = 'eng'
}: {
    uuid?: string;
    language?: string;
} = {}): SetContactLanguage => ({
    uuid,
    language,
    type: Types.set_contact_language
});

export const createSetContactChannelAction = ({
    uuid = utils.createUUID(),
    channelName = 'Twilio Channel'
}: {
    uuid?: string;
    channelName?: string;
} = {}): SetContactChannel => ({
    uuid,
    channel: {
        uuid,
        name: channelName
    },
    type: Types.set_contact_channel
});

export const createSetRunResultAction = ({
    uuid = utils.createUUID(),
    name = 'Name',
    value = 'Grace',
    category = ''
}: {
    uuid?: string;
    name?: string;
    value?: string;
    category?: string;
} = {}): SetRunResult => ({
    uuid,
    name,
    value,
    category,
    type: Types.set_run_result
});

export const createWebhookRouterNode = (): FlowNode => {
    const { categories, exits } = createCategories([
        WebhookExitNames.Success,
        WebhookExitNames.Failure,
        WebhookExitNames.Unreachable
    ]);

    const cases: Case[] = [
        {
            uuid: utils.createUUID(),
            type: Operators.is_text_eq,
            arguments: ['success'],
            category_uuid: categories[0].uuid
        },
        {
            uuid: utils.createUUID(),
            type: Operators.is_text_eq,
            arguments: ['response_error'],
            category_uuid: categories[1].uuid
        },
        {
            uuid: utils.createUUID(),
            type: Operators.is_text_eq,
            arguments: ['connection_error'],
            category_uuid: categories[2].uuid
        }
    ];

    return {
        uuid: utils.createUUID(),
        actions: [
            {
                uuid: utils.createUUID(),
                headers: {},
                type: Types.call_webhook,
                url: 'http://www.google.com',
                method: 'GET'
            } as CallWebhook
        ],
        router: {
            type: RouterTypes.switch,
            operand: '@run.webhook.status',
            cases,
            categories,
            default_category_uuid: categories[categories.length - 1].uuid
        } as SwitchRouter,
        exits
    };
};

export const getActionFormProps = (action: AnyAction): ActionFormProps => ({
    assetStore: {},
    addAsset: jest.fn(),
    updateAction: jest.fn(),
    onClose: jest.fn(),
    onTypeChange: jest.fn(),
    typeConfig: getTypeConfig(action.type),
    nodeSettings: {
        originalNode: null,
        originalAction: action
    }
});

export const getRouterFormProps = (renderNode: RenderNode): RouterFormProps => ({
    updateRouter: jest.fn(),
    onClose: jest.fn(),
    onTypeChange: jest.fn(),
    typeConfig: determineTypeConfig({ originalNode: renderNode }),
    assetStore: {
        results: { type: AssetType.Result, items: {} },
        fields: { type: AssetType.Field, items: {} }
    },
    nodeSettings: {
        originalNode: renderNode,
        originalAction: null
    }
});

// tslint:disable-next-line:variable-name
export const createCase = ({
    uuid,
    type,
    category_uuid,
    args = []
}: {
    uuid: string;
    type: Operators;
    category_uuid: string;
    args?: string[];
}) => ({
    uuid,
    type,
    category_uuid,
    arguments: args
});

export const createExit = ({
    uuid = utils.createUUID(),
    destination_uuid = null
}: {
    uuid?: string;
    destination_uuid?: string;
} = {}) => ({
    uuid,
    destination_uuid
});

// tslint:disable-next-line:variable-name
export const createWait = ({ type, timeout }: { type: WaitTypes; timeout?: number }) => ({
    type,
    ...(timeout ? { timeout } : {})
});

// tslint:disable-next-line:variable-name
export const createRouter = (result_name?: string): Router => ({
    categories: [],
    type: RouterTypes.switch,
    ...(result_name ? { result_name } : {})
});

export const createMatchCase = (match: string): CaseProps => {
    return {
        uuid: utils.createUUID(),
        categoryName: match,
        valid: true,
        kase: {
            uuid: utils.createUUID(),
            arguments: [match.toLowerCase()],
            type: Operators.has_any_word,
            category_uuid: null
        }
    };
};

export const createEmptyNode = (): FlowNode => {
    return {
        uuid: utils.createUUID(),
        actions: [],
        exits: []
    };
};

export const createCases = (categories: string[]): CaseProps[] => {
    const cases: CaseProps[] = [];
    categories.forEach((category: string) => {
        cases.push(createMatchCase(category));
    });
    return cases;
};

export const createRoutes = (
    categories: string[],
    hasTimeout: boolean = false
): CategorizedCases => {
    const cases: CaseProps[] = [];
    categories.forEach((category: string) => {
        cases.push(createMatchCase(category));
    });

    return resolveRoutes(cases, hasTimeout, null, DEFAULT_OPERAND);
};

export const createMatchRouter = (matches: string[], hasTimeout: boolean = false): RenderNode => {
    const { exits, categories, cases } = createRoutes(matches, hasTimeout);
    return createRenderNode({
        actions: [],
        exits,
        router: {
            type: RouterTypes.switch,
            operand: DEFAULT_OPERAND,
            categories,
            cases,
            default_category_uuid: categories[categories.length - 1].uuid,
            result_name: 'Color'
        } as SwitchRouter
    });
};

export const createSwitchRouter = ({
    cases,
    categories = [],
    operand = '@input',
    default_category_uuid = null
}: {
    cases: Case[];
    categories: Category[];
    operand?: string;
    // tslint:disable-next-line:variable-name
    default_category_uuid?: string;
}) => ({
    ...createRouter(),
    cases,
    categories,
    operand,
    default_category_uuid
});

export const createRenderNode = ({
    actions,
    exits,
    uuid = utils.createUUID(),
    router = null,
    wait = null,
    ui = {
        position: { left: 0, top: 0 },
        type: Types.split_by_expression
    }
}: {
    actions: AnyAction[];
    exits: Exit[];
    uuid?: string;
    router?: Router | SwitchRouter;
    wait?: Wait;
    ui?: UINode;
}): RenderNode => {
    const renderNode: RenderNode = {
        node: {
            actions,
            exits,
            uuid,
            ...(router ? { router } : ({} as any)),
            ...(wait ? { wait } : ({} as any))
        },
        ui,
        inboundConnections: {}
    };
    return renderNode;
};

export const createFlowNode = ({
    actions,
    exits,
    uuid = utils.createUUID(),
    router = null,
    wait = null
}: {
    actions: AnyAction[];
    exits: Exit[];
    uuid?: string;
    router?: Router | SwitchRouter;
    wait?: Wait;
}): FlowNode => ({
    actions,
    exits,
    uuid,
    ...(router ? { router } : ({} as any)),
    ...(wait ? { wait } : ({} as any))
});

export const createWaitRouterNode = ({
    exits,
    cases,
    categories,
    uuid = utils.createUUID(),
    timeout
}: {
    exits: Exit[];
    cases: Case[];
    categories: Category[];
    timeout?: number;
    uuid?: string;
}): RenderNode =>
    createRenderNode({
        actions: [],
        exits,
        uuid,
        router: createSwitchRouter({
            categories,
            cases
        }),
        wait: createWait({ type: WaitTypes.msg, timeout })
    });

export const createCategories = (names: string[]): { categories: Category[]; exits: Exit[] } => {
    const exits = names.map((cat: string) => {
        return {
            uuid: utils.createUUID(),
            destination_uuid: null
        };
    });

    const categories = exits.map((e: Exit, index: number) => {
        return {
            name: names[index],
            uuid: utils.createUUID(),
            exit_uuid: e.uuid
        };
    });

    return { exits, categories };
};

export const createRandomNode = (buckets: number) => {
    const { categories, exits } = createCategories(
        utils.range(0, buckets).map((bucketIdx: number) => `Bucket ${bucketIdx + 1}`)
    );
    return createRenderNode({
        actions: [],
        exits,
        uuid: utils.createUUID(),
        router: {
            type: RouterTypes.random,
            categories
        },
        ui: { position: { left: 0, top: 0 }, type: Types.split_by_random }
    });
};

export const createSubflowNode = (
    startFlowAction: StartFlow,
    uuid: string = utils.createUUID()
): RenderNode => {
    const { categories, exits } = createCategories([
        StartFlowExitNames.Complete,
        StartFlowExitNames.Expired
    ]);

    return createRenderNode({
        actions: [startFlowAction],
        exits,
        uuid,
        router: createSwitchRouter({
            categories,
            cases: [
                createCase({
                    uuid: utils.createUUID(),
                    type: Operators.has_run_status,
                    category_uuid: categories[0].uuid,
                    args: [StartFlowArgs.Complete]
                }),
                createCase({
                    uuid: utils.createUUID(),
                    type: Operators.has_run_status,
                    category_uuid: categories[1].uuid,
                    args: [StartFlowArgs.Expired]
                })
            ],
            operand: '@child',
            default_category_uuid: null
        }),
        ui: { position: { left: 0, top: 0 }, type: Types.split_by_subflow }
    });
};

export const createAirtimeTransferNode = (
    transferAirtimeAction: TransferAirtime,
    uuid: string = utils.createUUID()
): RenderNode => {
    const { categories, exits } = createCategories([
        WebhookExitNames.Success,
        WebhookExitNames.Failure,
        WebhookExitNames.Unreachable
    ]);

    return createRenderNode({
        actions: [transferAirtimeAction],
        exits,
        uuid,
        router: createSwitchRouter({
            categories,
            cases: [
                createCase({
                    uuid: utils.createUUID(),
                    type: Operators.has_webhook_status,
                    category_uuid: categories[0].uuid,
                    args: ['success']
                }),
                createCase({
                    uuid: utils.createUUID(),
                    type: Operators.has_webhook_status,
                    category_uuid: categories[1].uuid,
                    args: ['response_error']
                }),
                createCase({
                    uuid: utils.createUUID(),
                    type: Operators.has_webhook_status,
                    category_uuid: categories[2].uuid,
                    args: ['response_failure']
                })
            ],
            operand: '@child',
            default_category_uuid: null
        }),
        ui: { position: { left: 0, top: 0 }, type: Types.split_by_resthook }
    });
};

export const createResthookNode = (
    callResthookAction: CallResthook,
    uuid: string = utils.createUUID()
): RenderNode => {
    const { categories, exits } = createCategories([
        WebhookExitNames.Success,
        WebhookExitNames.Failure,
        WebhookExitNames.Unreachable
    ]);

    return createRenderNode({
        actions: [callResthookAction],
        exits,
        uuid,
        router: createSwitchRouter({
            categories,
            cases: [
                createCase({
                    uuid: utils.createUUID(),
                    type: Operators.has_webhook_status,
                    category_uuid: categories[0].uuid,
                    args: ['success']
                }),
                createCase({
                    uuid: utils.createUUID(),
                    type: Operators.has_webhook_status,
                    category_uuid: categories[1].uuid,
                    args: ['response_error']
                }),
                createCase({
                    uuid: utils.createUUID(),
                    type: Operators.has_webhook_status,
                    category_uuid: categories[2].uuid,
                    args: ['response_failure']
                })
            ],
            operand: '@child',
            default_category_uuid: null
        }),
        ui: { position: { left: 0, top: 0 }, type: Types.split_by_resthook }
    });
};

export const createGroupsRouterNode = (
    groups: Group[] = groupsResults,
    uuid: string = utils.createUUID()
): RenderNode => {
    const exits = groups.map((group, idx) =>
        createExit({
            uuid: utils.createUUID(),
            destination_uuid: null
        })
    );

    exits.push({ uuid: utils.createUUID(), destination_uuid: null });

    const categories = groups.map((group, idx) => {
        return {
            name: group.name,
            uuid: utils.createUUID(),
            exit_uuid: exits[0].uuid
        };
    });

    categories.push({
        name: DefaultExitNames.Other,
        uuid: utils.createUUID(),
        exit_uuid: exits[exit.length - 1].uuid
    });

    const cases = groups.map((group, idx) =>
        createCase({
            uuid: utils.createUUID(),
            type: Operators.has_group,
            category_uuid: categories[idx].uuid,
            args: [group.uuid]
        })
    );

    return createRenderNode({
        actions: [],
        exits,
        uuid,
        router: createSwitchRouter({
            categories,
            cases,
            operand: '@contact',
            default_category_uuid: categories[categories.length - 1].uuid
        }),
        ui: {
            type: Types.split_by_groups,
            position: { left: 0, top: 0 }
        }
    });
};

export const getGroupOptions = (groups: Group[] = groupsResults) =>
    groups.map(({ name, uuid }) => ({
        name,
        id: uuid
    }));

export const getGroups = (sliceAt: number, groups: Group[] = groupsResults) =>
    groups
        .map(({ name, uuid }) => ({
            name,
            id: uuid
        }))
        .slice(sliceAt);

export const createAddLabelsAction = (labels: Label[]) => ({
    type: Types.add_input_labels,
    uuid: 'aa15ef19-da81-43d0-b6e5-84b47216aeb8',
    labels
});

export const English = { name: 'English', id: 'eng', type: AssetType.Language };

export const Spanish = { name: 'Spanish', id: 'spa', type: AssetType.Language };

export const SubscribersGroup = {
    name: 'Subscriber',
    id: '68223118-109f-442a-aed3-7bb3e1eab687',
    type: AssetType.Group
};

export const ColorFlowAsset = {
    name: 'Favorite Color',
    uuid: '9a93ede6-078f-44c9-ad0a-133793be5d56'
};

export const ResthookAsset = { id: 'new-resthook', name: 'new-resthook', type: AssetType.Resthook };

export const FeedbackLabel = { name: 'Feedback', id: 'feedback_label', type: AssetType.Label };

export const languages: Assets = {
    items: assetListToMap(
        languagesResults.results.map((language: any) => languageToAsset(language))
    ),
    type: AssetType.Language
};
