import { NAME_PROPERTY } from '~/components/flow/props';
import { CaseProps } from '~/components/flow/routers/caselist/CaseList';
import { FieldRouterFormState } from '~/components/flow/routers/field/FieldRouterForm';
import {
    createCaseProps,
    createRenderNode,
    getInitialArgument,
    hasCases,
    resolveRoutes
} from '~/components/flow/routers/helpers';
import { DEFAULT_OPERAND } from '~/components/nodeeditor/constants';
import { Types } from '~/config/interfaces';
import { getType } from '~/config/typeConfigs';
import { Router, RouterTypes, SwitchRouter } from '~/flowTypes';
import { AssetStore, AssetType, RenderNode } from '~/store/flowContext';
import { NodeEditorSettings, StringEntry } from '~/store/nodeEditor';

export const nodeToState = (
    settings: NodeEditorSettings,
    assetStore: AssetStore
): FieldRouterFormState => {
    let initialCases: CaseProps[] = [];

    // TODO: work out an incremental result name
    let resultName: StringEntry = { value: '' };

    let field: any = NAME_PROPERTY;

    if (settings.originalNode && settings.originalNode.ui.type === Types.split_by_contact_field) {
        const router = settings.originalNode.node.router as SwitchRouter;

        if (router) {
            if (hasCases(settings.originalNode.node)) {
                initialCases = createCaseProps(router.cases, settings.originalNode);
            }

            resultName = { value: router.result_name || '' };
        }

        const asset = settings.originalNode.ui.config.router.operandAsset;
        const name =
            assetStore.fields && asset.id in assetStore.fields.items
                ? assetStore.fields.items[asset.id].name
                : null;
        field = { id: asset.id, type: asset.type, name };
    }

    return {
        cases: initialCases,
        resultName,
        field: { value: field },
        valid: true
    };
};

export const stateToNode = (
    settings: NodeEditorSettings,
    state: FieldRouterFormState
): RenderNode => {
    let initialArgument =
        getType(settings.originalNode) === Types.split_by_contact_field
            ? getInitialArgument(settings.originalNode)
            : DEFAULT_OPERAND;

    const asset = state.field.value;
    if (asset.type === AssetType.URN) {
        initialArgument = `@(format_urn(contact.urns.${asset.id}))`;
    } else if (asset.type === AssetType.Field) {
        initialArgument = `@contact.fields.${asset.id}`;
    } else {
        initialArgument = `@contact.${asset.id}`;
    }

    const { cases, exits, defaultCategory: defaultExit, caseConfig, categories } = resolveRoutes(
        state.cases,
        false,
        settings.originalNode.node,
        initialArgument
    );

    const optionalRouter: Pick<Router, 'result_name'> = {};
    if (state.resultName.value) {
        optionalRouter.result_name = state.resultName.value;
    }

    const router: SwitchRouter = {
        type: RouterTypes.switch,
        default_category_uuid: defaultExit,
        cases,
        categories,
        ...optionalRouter
    };

    const newRenderNode = createRenderNode(
        settings.originalNode.node.uuid,
        router,
        exits,
        Types.split_by_contact_field,
        [],
        null,
        {
            router: {
                operand: initialArgument,
                operandAsset: {
                    id: asset.id,
                    type: asset.type,
                    name: asset.name
                },
                cases: caseConfig
            }
        }
    );

    return newRenderNode;
};
