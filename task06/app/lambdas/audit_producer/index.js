const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');

const region = process.env.region;
const auditTable = process.env.audit_table;

const dbClient = new DynamoDBClient({ region });
const docClient = DynamoDBDocumentClient.from(dbClient);

exports.handler = async (event) => {
	console.log('Received event:', JSON.stringify(event, null, 2));

	try {
		const auditRecords = [];

		for (const record of event.Records) {
			const eventType = record.eventName;
			const newImage = record.dynamodb.NewImage || {};
			const oldImage = record.dynamodb.OldImage || {};

			if (eventType === 'INSERT') {
				const auditEntry = {
					id: uuidv4(),
					itemKey: newImage.key.S,
					modificationTime: new Date().toISOString(),
					newValue: {
						key: newImage.key.S,
						value: parseInt(newImage.value.N, 10),
					},
				};
				auditRecords.push(auditEntry);
			} else if (eventType === 'MODIFY') {
				if (
					newImage.value &&
					oldImage.value &&
					newImage.value.N !== oldImage.value.N
				) {
					const auditEntry = {
						id: uuidv4(),
						itemKey: newImage.key.S,
						modificationTime: new Date().toISOString(),
						updatedAttribute: 'value',
						oldValue: parseInt(oldImage.value.N, 10),
						newValue: parseInt(newImage.value.N, 10),
					};
					auditRecords.push(auditEntry);
				}
			}
		}

		for (const auditEntry of auditRecords) {
			await docClient.send(
				new PutCommand({
					TableName: auditTable,
					Item: auditEntry,
				})
			);
			console.log('Audit record saved:', auditEntry);
		}

		return { statusCode: 200, body: 'Audit records processed successfully' };
	} catch (error) {
		console.error('Error processing audit records:', error);
		return {
			statusCode: 500,
			body: JSON.stringify({ message: 'Internal Server Error' }),
		};
	}
};
