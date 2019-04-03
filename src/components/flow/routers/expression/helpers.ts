import { CaseProps } from '~/components/flow/routers/caselist/CaseList';
import { ExpressionRouterFormState } from '~/components/flow/routers/expression/ExpressionRouterForm';
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
import { RenderNode } from '~/store/flowContext';
import { NodeEditorSettings, StringEntry } from '~/store/nodeEditor';

export const nodeToState = (settings: NodeEditorSettings): ExpressionRouterFormState => {
    let initialCases: CaseProps[] = [];
    let resultName: StringEntry = { value: '' };
    let initialArgument = DEFAULT_OPERAND;

    if (getType(settings.originalNode) === Types.split_by_expression) {
        initialArgument = getInitialArgument(settings.originalNode);
        const router = settings.originalNode.node.router as SwitchRouter;
        if (router) {
            if (hasCases(settings.originalNode.node)) {
                initialCases = createCaseProps(router.cases, settings.originalNode);
            }

            resultName = { value: router.result_name || '' };
        }
    }

    return {
        cases: initialCases,
        resultName,
        operand: { value: initialArgument },
        valid: true
    };
};

export const stateToNode = (
    settings: NodeEditorSettings,
    state: ExpressionRouterFormState
): RenderNode => {
    const { cases, exits, defaultCategory: defaultExit, caseConfig, categories } = resolveRoutes(
        state.cases,
        false,
        settings.originalNode.node,
        state.operand.value
    );

    const optionalRouter: Pick<Router, 'result_name'> = {};
    if (state.resultName.value) {
        optionalRouter.result_name = state.resultName.value;
    }

    const router: SwitchRouter = {
        type: RouterTypes.switch,
        default_category_uuid: defaultExit,
        categories,
        cases,
        ...optionalRouter
    };

    const newRenderNode = createRenderNode(
        settings.originalNode.node.uuid,
        router,
        exits,
        Types.split_by_expression,
        [],
        null,
        { router: { cases: caseConfig, operand: state.operand.value } }
    );

    return newRenderNode;
};
