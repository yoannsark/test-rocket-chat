import { Meteor } from 'meteor/meteor';
import _ from 'underscore';

import { Roles, Permissions } from '../../models';

Meteor.startup(() => {
	const roles = _.pluck(Roles.find().fetch(), 'name');
	if (roles.indexOf('livechat-agent') === -1) {
		Roles.createOrUpdate('livechat-agent');
	}
	if (roles.indexOf('livechat-manager') === -1) {
		Roles.createOrUpdate('livechat-manager');
	}
	if (roles.indexOf('livechat-guest') === -1) {
		Roles.createOrUpdate('livechat-guest');
	}
	if (Permissions) {
		Permissions.createOrUpdate('view-l-room', ['livechat-agent', 'livechat-manager', 'admin']);
		Permissions.createOrUpdate('view-livechat-manager', ['livechat-manager', 'admin']);
		Permissions.createOrUpdate('view-livechat-rooms', ['livechat-manager', 'admin']);
		Permissions.createOrUpdate('close-livechat-room', ['livechat-agent', 'livechat-manager', 'admin']);
		Permissions.createOrUpdate('close-others-livechat-room', ['livechat-manager', 'admin']);
		Permissions.createOrUpdate('save-others-livechat-room-info', ['livechat-manager']);
		Permissions.createOrUpdate('remove-closed-livechat-rooms', ['livechat-manager', 'admin']);
		Permissions.createOrUpdate('view-livechat-analytics', ['livechat-manager', 'admin']);
		Permissions.createOrUpdate('view-livechat-queue', ['livechat-manager', 'admin']);
		Permissions.createOrUpdate('transfer-livechat-guest', ['livechat-manager', 'admin']);
		Permissions.createOrUpdate('manage-livechat-managers', ['livechat-manager', 'admin']);
		Permissions.createOrUpdate('manage-livechat-agents', ['livechat-manager', 'admin']);
		Permissions.createOrUpdate('manage-livechat-departments', ['livechat-manager', 'admin']);
		Permissions.createOrUpdate('view-livechat-departments', ['livechat-manager', 'admin']);
		Permissions.createOrUpdate('add-livechat-department-agents', ['livechat-manager', 'admin']);
		Permissions.createOrUpdate('view-livechat-current-chats', ['livechat-manager', 'admin']);
		Permissions.createOrUpdate('view-livechat-analytics', ['livechat-manager', 'admin']);
		Permissions.createOrUpdate('view-livechat-real-time-monitoring', ['livechat-manager', 'admin']);
		Permissions.createOrUpdate('view-livechat-triggers', ['livechat-manager', 'admin']);
		Permissions.createOrUpdate('view-livechat-customfields', ['livechat-manager', 'admin']);
		Permissions.createOrUpdate('view-livechat-installation', ['livechat-manager', 'admin']);
		Permissions.createOrUpdate('view-livechat-appearance', ['livechat-manager', 'admin']);
		Permissions.createOrUpdate('view-livechat-webhooks', ['livechat-manager', 'admin']);
		Permissions.createOrUpdate('view-livechat-facebook', ['livechat-manager', 'admin']);
		Permissions.createOrUpdate('view-livechat-officeHours', ['livechat-manager', 'admin']);
	}
});
