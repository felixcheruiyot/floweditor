import { CaseProps } from '~/components/flow/routers/caselist/CaseList';
import { GroupsRouterFormState } from '~/components/flow/routers/groups/GroupsRouterForm';
import {
    createRenderNode,
    getSwitchRouter,
    resolveRoutes
} from '~/components/flow/routers/helpers';
import { GROUPS_OPERAND } from '~/components/nodeeditor/constants';
import { Operators, Types } from '~/config/interfaces';
import { Category, FlowNode, RouterTypes, SwitchRouter } from '~/flowTypes';
import { Asset, AssetType, RenderNode } from '~/store/flowContext';
import { NodeEditorSettings } from '~/store/nodeEditor';
import { createUUID } from '~/utils';

export const nodeToState = (settings: NodeEditorSettings): GroupsRouterFormState => {
    const state: GroupsRouterFormState = {
        groups: { value: [] },
        resultName: { value: '' },
        valid: false
    };

    if (settings.originalNode.ui.type === Types.split_by_groups) {
        state.groups.value = extractGroups(settings.originalNode.node);
        state.resultName = {
            value: (settings.originalNode.node.router as SwitchRouter).result_name || ''
        };
        state.valid = true;
    }

    return state;
};

export const stateToNode = (
    settings: NodeEditorSettings,
    state: GroupsRouterFormState
): RenderNode => {
    const currentCases = groupsToCases(state.groups.value);
    const { cases, exits, defaultCategory: defaultExit, caseConfig, categories } = resolveRoutes(
        currentCases,
        false,
        settings.originalNode.node,
        GROUPS_OPERAND
    );

    const router: SwitchRouter = {
        type: RouterTypes.switch,
        cases,
        categories,
        default_category_uuid: defaultExit,
        result_name: state.resultName.value
    };

    return createRenderNode(
        settings.originalNode.node.uuid,
        router,
        exits,
        Types.split_by_groups,
        [],
        null,
        { router: { cases: caseConfig } }
    );
};

export const extractGroups = (node: FlowNode): Asset[] => {
    let groups: Asset[] = [];
    const router = getSwitchRouter(node);
    if (router) {
        groups = (router as SwitchRouter).cases.map(kase => {
            const category = router.categories.find(
                (cat: Category) => cat.uuid === kase.category_uuid
            );
            return { name: category.name, id: kase.arguments[0], type: AssetType.Group };
        });
    }
    return groups;
};
export const groupsToCases = (groups: Asset[] = []): CaseProps[] =>
    groups.map(({ name, id }: Asset) => ({
        uuid: id,
        kase: {
            uuid: createUUID(),
            type: Operators.has_group,
            arguments: [id],
            category_uuid: ''
        },
        categoryName: name,
        valid: true
    }));
