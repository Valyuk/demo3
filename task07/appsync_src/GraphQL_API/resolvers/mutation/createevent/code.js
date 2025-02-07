import { util } from '@aws-appsync/utils';
import { v4 as uuidv4 } from 'uuid';

/**
 * Sends a request to the attached data source
 * @param {import('@aws-appsync/utils').Context} ctx the context
 * @returns {*} the request
 */
export function request(ctx) {
	const { userId, payLoad } = ctx.arguments;

	const newItem = {
		id: uuidv4(),
		userId,
		createdAt: util.time.nowISO8601(),
		payLoad: util.dynamodb.toMapValues(JSON.parse(payLoad)),
	};

	return {
		operation: 'PutItem',
		key: { id: util.dynamodb.toDynamoDB(newItem.id) },
		attributeValues: util.dynamodb.toMapValues(newItem),
	};
}

/**
 * Returns the resolver result
 * @param {import('@aws-appsync/utils').Context} ctx the context
 * @returns {*} the result
 */
export function response(ctx) {
	return ctx.result
		? ctx.result.attributes
		: util.error('Failed to create event', 'InternalError');
}
