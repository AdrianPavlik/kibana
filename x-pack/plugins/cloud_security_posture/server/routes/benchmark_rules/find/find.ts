/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { transformError } from '@kbn/securitysolution-es-utils';
import {
  FindCspBenchmarkRuleRequest,
  FindCspBenchmarkRuleResponse,
  findCspBenchmarkRuleRequestSchema,
} from '../../../../common/types/latest';

import { FIND_CSP_BENCHMARK_RULE_ROUTE_PATH } from '../../../../common/constants';
import { CspRouter } from '../../../types';
import { findRuleHandler as findRuleHandlerV1 } from './v1';

export const defineFindCspBenchmarkRuleRoute = (router: CspRouter) =>
  router.versioned
    .get({
      access: 'internal',
      path: FIND_CSP_BENCHMARK_RULE_ROUTE_PATH,
    })
    .addVersion(
      {
        version: '1',
        validate: {
          request: {
            query: findCspBenchmarkRuleRequestSchema,
          },
        },
      },
      async (context, request, response) => {
        if (!(await context.fleet).authz.fleet.all) {
          return response.forbidden();
        }

        const requestBody: FindCspBenchmarkRuleRequest = request.query;
        const cspContext = await context.csp;

        try {
          const cspBenchmarkRules: FindCspBenchmarkRuleResponse = await findRuleHandlerV1(
            cspContext.soClient,
            requestBody
          );
          return response.ok({ body: cspBenchmarkRules });
        } catch (err) {
          const error = transformError(err);
          cspContext.logger.error(`Failed to fetch csp rules templates ${err}`);
          return response.customError({
            body: { message: error.message },
            statusCode: error.statusCode,
          });
        }
      }
    );
