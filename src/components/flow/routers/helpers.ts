import { CaseProps } from '~/components/flow/routers/caselist/CaseList';
import { DefaultExitNames } from '~/components/flow/routers/constants';
import { DEFAULT_OPERAND } from '~/components/nodeeditor/constants';
import { Operators, Types } from '~/config/interfaces';
import { getOperatorConfig } from '~/config/operatorConfigs';
import {
    Action,
    Case,
    CaseConfig,
    Category,
    Exit,
    FlowNode,
    Router,
    RouterTypes,
    SwitchRouter,
    UIConfig,
    Wait
} from '~/flowTypes';
import { RenderNode } from '~/store/flowContext';
import { createUUID } from '~/utils';

export interface CategorizedCases {
    cases: Case[];
    categories: Category[];
    exits: Exit[];
    caseConfig: CaseConfig;
}
export interface ResolvedRoutes extends CategorizedCases {
    defaultCategory: string;
}

export const createRenderNode = (
    uuid: string,
    router: Router,
    exits: Exit[],
    type: Types,
    actions: Action[] = [],
    wait: Wait = null,
    uiConfig: UIConfig = {}
): RenderNode => {
    const renderNode: RenderNode = {
        node: {
            uuid,
            actions,
            router,
            exits
        },
        ui: {
            type,
            position: null,
            config: uiConfig
        },
        inboundConnections: {}
    };

    if (wait) {
        renderNode.node.wait = wait;
    }

    return renderNode;
};

export const hasCases = (node: FlowNode): boolean => {
    if (
        node.router &&
        (node.router as SwitchRouter).cases &&
        (node.router as SwitchRouter).cases.length
    ) {
        return true;
    }
    return false;
};

export const getCategories = (renderNode: RenderNode): Category[] => {
    if (renderNode.node.router) {
        return renderNode.node.router.categories;
    }
    return [];
};

export const createCaseProps = (cases: Case[], renderNode: RenderNode): CaseProps[] => {
    const exits = renderNode.node.exits;
    const categories: Category[] = getCategories(renderNode);

    return cases
        .filter((kase: Case) => kase.type !== Operators.has_wait_timed_out)
        .map((kase: Case) => {
            const matchingCategory = categories.find(
                (category: Category) => category.uuid === kase.category_uuid
            );

            // trim off our initial argument
            kase.arguments = kase.arguments.slice(1);
            if (isRelativeDate(kase.type)) {
                if (renderNode.ui.config && renderNode.ui.config.router.cases) {
                    const caseConfig = renderNode.ui.config.router.cases[kase.uuid];
                    if (caseConfig && caseConfig.arguments) {
                        kase.arguments = caseConfig.arguments;
                    }
                }
            }

            return {
                uuid: kase.uuid,
                kase,
                categoryName: matchingCategory ? matchingCategory.name : null,
                valid: true
            };
        });
};

export const isRelativeDate = (operatorType: Operators): boolean => {
    return !![Operators.has_date_eq, Operators.has_date_gt, Operators.has_date_lt].find(
        (type: string) => operatorType === type
    );
};

const isCategoryMatch = (cat: Category, name: string) => {
    return cat.name.toLowerCase().trim() === name.trim().toLowerCase();
};

/**
 * Given a set of cases and previous categories, determines correct merging of cases
 * and the union of categories
 */
export const categorizeCases = (
    newCases: CaseProps[],
    originalNode: FlowNode,
    initialArgument: string
): CategorizedCases => {
    const categories: Category[] = [];
    const cases: Case[] = [];
    const exits: Exit[] = [];
    const caseConfig: CaseConfig = {};

    let firstArgument = initialArgument;
    const originalRouter = originalNode && originalNode.router;
    const previousCategories = (originalRouter && originalRouter.categories) || [];

    // look over the new cases and match up categories and exits
    for (const newCase of newCases) {
        // ignore empty cases
        if (!newCase.categoryName || newCase.categoryName.trim().length === 0) {
            continue;
        }

        // convert relative dates to expressions with configs
        if (isRelativeDate(newCase.kase.type)) {
            caseConfig[newCase.uuid] = { ['arguments']: newCase.kase.arguments };
            newCase.kase.arguments = [
                `@(datetime_add(today(), ${newCase.kase.arguments[0]}, "D"))`
            ];
        }

        // operators can override the initial argument
        const operatorArgument = getOperatorConfig(newCase.kase.type).initialArgument;
        if (operatorArgument) {
            firstArgument = operatorArgument;
        }

        // prepend our initial argument
        newCase.kase.arguments = [firstArgument, ...newCase.kase.arguments];

        //  see if it exists on a previous case
        let category = categories.find((cat: Category) =>
            isCategoryMatch(cat, newCase.categoryName)
        );

        // if not, see if that category exists on our old node
        if (!category) {
            category = previousCategories.find((cat: Category) =>
                isCategoryMatch(cat, newCase.categoryName)
            );

            // we found an old category, bring it and its exit over
            if (category) {
                categories.push(category);
                const previousExit = originalNode.exits.find(
                    (exit: Exit) => category.exit_uuid === exit.uuid
                );
                exits.push(previousExit);
            }
        }

        // if still no category, finally lets just create a new one
        if (!category) {
            const exit: Exit = {
                uuid: createUUID()
            };

            exits.push(exit);

            category = {
                uuid: createUUID(),
                name: newCase.categoryName,
                exit_uuid: exit.uuid
            };

            categories.push(category);
        }

        // lastly, add our case
        cases.push({
            ...newCase.kase,
            category_uuid: category.uuid
        });
    }

    return { cases, categories, exits, caseConfig };
};

export const getSwitchRouter = (node: FlowNode): SwitchRouter => {
    if (node && node.router && node.router.type === RouterTypes.switch) {
        return node.router as SwitchRouter;
    }
    return null;
};

/**
 * Adds a default route, reusing the previous one if possible
 * @param originalNode
 */
export const getDefaultRoute = (
    hasCategories: boolean,
    originalNode: FlowNode
): { defaultCategory: Category; defaultExit: Exit } => {
    const originalRouter = getSwitchRouter(originalNode);

    // use the previous default if it had one
    if (originalRouter) {
        const defaultCategory = originalRouter.categories.find(
            (cat: Category) => cat.uuid === originalRouter.default_category_uuid
        );

        const defaultExit = originalNode.exits.find(
            (e: Exit) => e.uuid === defaultCategory.exit_uuid
        );

        defaultCategory.name = hasCategories
            ? DefaultExitNames.Other
            : DefaultExitNames.All_Responses;

        return { defaultCategory, defaultExit };
    }
    // otherwise, create a new exit and category
    else {
        const defaultExit: Exit = {
            uuid: createUUID()
        };

        const defaultCategory = {
            uuid: createUUID(),
            name: hasCategories ? DefaultExitNames.Other : DefaultExitNames.All_Responses,
            exit_uuid: defaultExit.uuid
        };

        return { defaultCategory, defaultExit };
    }
};

const getTimeoutRoute = (
    originalNode: FlowNode
): { timeoutCase: Case; timeoutCategory: Category; timeoutExit: Exit } => {
    let timeoutCategory: Category = null;
    let timeoutExit: Exit = null;
    let timeoutCase: Case = null;

    const originalRouter = getSwitchRouter(originalNode);

    // see if our previous node had a timeout case
    if (originalRouter) {
        timeoutCase = originalRouter.cases.find(
            (kase: Case) => kase.type === Operators.has_wait_timed_out
        );

        if (timeoutCase) {
            timeoutCategory = originalRouter.categories.find(
                (cat: Category) => cat.uuid === timeoutCase.category_uuid
            );
            timeoutExit = originalNode.exits.find(
                (exit: Exit) => exit.uuid === timeoutCategory.exit_uuid
            );
        }
    }

    if (!timeoutCase) {
        // create a new route
        timeoutExit = {
            uuid: createUUID()
        };

        timeoutCategory = {
            uuid: createUUID(),
            name: DefaultExitNames.No_Response,
            exit_uuid: timeoutExit.uuid
        };

        timeoutCase = {
            uuid: createUUID(),
            type: Operators.has_wait_timed_out,
            omit_operand: true,
            arguments: ['@run'],
            category_uuid: timeoutCategory.uuid
        };
    }

    return { timeoutCase, timeoutCategory, timeoutExit };
};

/**
 * Given a set of cases and previous categories, determines correct merging of cases
 * and the union of categories
 */
export const resolveRoutes = (
    newCases: CaseProps[],
    hasTimeout: boolean,
    originalNode: FlowNode,
    initialArgument: string
): ResolvedRoutes => {
    const resolved = categorizeCases(newCases, originalNode, initialArgument);

    // tack on our other category
    const { defaultCategory, defaultExit } = getDefaultRoute(
        resolved.categories.length > 0,
        originalNode
    );

    resolved.categories.push(defaultCategory);
    resolved.exits.push(defaultExit);

    // add in a timeout route if we need one
    if (hasTimeout) {
        const { timeoutCase, timeoutCategory, timeoutExit } = getTimeoutRoute(originalNode);
        resolved.cases.push(timeoutCase);
        resolved.categories.push(timeoutCategory);
        resolved.exits.push(timeoutExit);
    }

    return { ...resolved, defaultCategory: defaultCategory.uuid };
};

export const getNestedObject = (ob: any, keys: string) => {
    let check = ob;
    for (const key of keys.split('.')) {
        console.log(check, key);
        if (key in check) {
            check = check[key];
        } else {
            return null;
        }
    }
    return check;
};

export const getInitialArgument = (renderNode: RenderNode): string => {
    const operand = getNestedObject(renderNode, 'ui.config.router.operand');
    return operand || DEFAULT_OPERAND;
};
