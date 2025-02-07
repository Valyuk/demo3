import { util } from '@aws-appsync/utils';

/**
 * Sends a request to the attached data source
 * @param {import('@aws-appsync/utils').Context} ctx the context
 * @returns {*} the request
 */
export function request(ctx) {
	const { id } = ctx.arguments;

	return {
		operation: 'GetItem',
		key: {
			id: util.dynamodb.toDynamoDB(id),
		},
	};
}

/**
 * Returns the resolver result
 * @param {import('@aws-appsync/utils').Context} ctx the context
 * @returns {*} the result
 */
export function response(ctx) {
	if (!ctx.result) {
		return util.error(
			`Event with ID ${ctx.arguments.id} not found`,
			'NotFound'
		);
	}
	return ctx.result;
}
