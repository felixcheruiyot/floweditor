import { CaseProps } from '~/components/flow/routers/caselist/CaseList';
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
import { HintTypes, Router, RouterTypes, SwitchRouter, WaitTypes } from '~/flowTypes';
import { RenderNode } from '~/store/flowContext';
import { NodeEditorSettings, StringEntry } from '~/store/nodeEditor';

import { DigitsRouterFormState } from './DigitsRouterForm';

export const nodeToState = (settings: NodeEditorSettings): DigitsRouterFormState => {
    let initialCases: CaseProps[] = [];

    // TODO: work out an incremental result name
    let resultName: StringEntry = { value: '' };

    if (getType(settings.originalNode) === Types.wait_for_digits) {
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
        valid: true
    };
};

export const stateToNode = (
    settings: NodeEditorSettings,
    state: DigitsRouterFormState
): RenderNode => {
    const initialArgument =
        getType(settings.originalNode) === Types.wait_for_digits
            ? getInitialArgument(settings.originalNode)
            : DEFAULT_OPERAND;

    const { cases, exits, categories, defaultCategory: defaultExit, caseConfig } = resolveRoutes(
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
        categories,
        cases,
        ...optionalRouter
    };

    const newRenderNode = createRenderNode(
        settings.originalNode.node.uuid,
        router,
        exits,
        Types.wait_for_response,
        [],
        { type: WaitTypes.msg, hint: { type: HintTypes.digits } },
        { router: { cases: caseConfig, operand: initialArgument } }
    );

    return newRenderNode;
};
