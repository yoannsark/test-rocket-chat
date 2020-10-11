import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';
import _ from 'underscore';
import toastr from 'toastr';

import { t, handleError } from '../../../../utils';
import { hasPermission } from '../../../../authorization';
import { getCustomFormTemplate } from './customTemplates/register';
import './livechatDepartmentForm.html';
import { APIClient } from '../../../../utils/client';

Template.livechatDepartmentForm.helpers({
	department() {
		return Template.instance().department.get();
	},
	agents() {
		return Template.instance().department && !_.isEmpty(Template.instance().department.get()) ? Template.instance().department.get().agents : [];
	},
	selectedAgents() {
		return _.sortBy(Template.instance().selectedAgents.get(), 'username');
	},
	showOnRegistration(value) {
		const department = Template.instance().department.get();
		return department.showOnRegistration === value || (department.showOnRegistration === undefined && value === true);
	},
	showOnOfflineForm(value) {
		const department = Template.instance().department.get();
		return department.showOnOfflineForm === value || (department.showOnOfflineForm === undefined && value === true);
	},
	agentAutocompleteSettings() {
		return {
			limit: 10,
			rules: [{
				collection: 'UserAndRoom',
				subscription: 'userAutocomplete',
				field: 'username',
				template: Template.userSearch,
				noMatchTemplate: Template.userSearchEmpty,
				matchAll: true,
				filter: {
					exceptions: _.pluck(Template.instance().selectedAgents.get(), 'username'),
				},
				selector(match) {
					return { term: match };
				},
				sort: 'username',
			}],
		};
	},
	customFieldsTemplate() {
		return getCustomFormTemplate('livechatDepartmentForm');
	},
	data() {
		return { id: FlowRouter.getParam('_id') };
	},
});

Template.livechatDepartmentForm.events({
	'submit #department-form'(e, instance) {
		e.preventDefault();
		const $btn = instance.$('button.save');

		let departmentData;

		const _id = $(e.currentTarget).data('id');

		if (hasPermission('manage-livechat-departments')) {
			const enabled = instance.$('input[name=enabled]:checked').val();
			const name = instance.$('input[name=name]').val();
			const description = instance.$('textarea[name=description]').val();
			const showOnRegistration = instance.$('input[name=showOnRegistration]:checked').val();
			const email = instance.$('input[name=email]').val();
			const showOnOfflineForm = instance.$('input[name=showOnOfflineForm]:checked').val();

			if (enabled !== '1' && enabled !== '0') {
				return toastr.error(t('Please_select_enabled_yes_or_no'));
			}

			if (name.trim() === '') {
				return toastr.error(t('Please_fill_a_name'));
			}

			if (email.trim() === '' && showOnOfflineForm === '1') {
				return toastr.error(t('Please_fill_an_email'));
			}

			departmentData = {
				enabled: enabled === '1',
				name: name.trim(),
				description: description.trim(),
				showOnRegistration: showOnRegistration === '1',
				showOnOfflineForm: showOnOfflineForm === '1',
				email: email.trim(),
			};
		}

		const oldBtnValue = $btn.html();
		$btn.html(t('Saving'));

		instance.$('.customFormField').each((i, el) => {
			const elField = instance.$(el);
			const name = elField.attr('name');
			departmentData[name] = elField.val();
		});

		const departmentAgents = [];
		instance.selectedAgents.get().forEach((agent) => {
			agent.count = instance.$(`.count-${ agent.agentId }`).val();
			agent.order = instance.$(`.order-${ agent.agentId }`).val();

			departmentAgents.push(agent);
		});

		const callback = (error) => {
			$btn.html(oldBtnValue);
			if (error) {
				return handleError(error);
			}

			toastr.success(t('Saved'));
			FlowRouter.go('livechat-departments');
		};

		if (hasPermission('manage-livechat-departments')) {
			Meteor.call('livechat:saveDepartment', _id, departmentData, departmentAgents, callback);
		} else if (hasPermission('add-livechat-department-agents')) {
			Meteor.call('livechat:saveDepartmentAgents', _id, departmentAgents, callback);
		} else {
			throw new Error(t('error-not-authorized'));
		}
	},

	'click .add-agent'(e, instance) {
		e.preventDefault();
		const input = e.currentTarget.parentElement.children[0];
		const username = input.value;

		if (username.trim() === '') {
			return toastr.error(t('Please_fill_a_username'));
		}

		input.value = '';
		const agent = Template.instance().agents.get().find((agent) => agent.username === username);
		if (!agent) {
			return toastr.error(t('The_selected_user_is_not_an_agent'));
		}

		const agentId = agent._id;

		const selectedAgents = instance.selectedAgents.get();
		for (const oldAgent of selectedAgents) {
			if (oldAgent.agentId === agentId) {
				return toastr.error(t('This_agent_was_already_selected'));
			}
		}

		const newAgent = _.clone(agent);
		newAgent.agentId = agentId;
		delete newAgent._id;
		selectedAgents.push(newAgent);
		instance.selectedAgents.set(selectedAgents);
	},

	'click button.back'(e/* , instance*/) {
		e.preventDefault();
		FlowRouter.go('livechat-departments');
	},

	'click .remove-agent'(e, instance) {
		e.preventDefault();

		let selectedAgents = instance.selectedAgents.get();
		selectedAgents = _.reject(selectedAgents, (agent) => agent._id === this._id);
		instance.selectedAgents.set(selectedAgents);
	},
});

Template.livechatDepartmentForm.onCreated(async function() {
	this.department = new ReactiveVar({ enabled: true });
	this.selectedAgents = new ReactiveVar([]);
	this.agents = new ReactiveVar([]);

	const { users } = await APIClient.v1.get('livechat/users/agent');
	this.agents.set(users);

	this.autorun(async () => {
		const id = FlowRouter.getParam('_id');
		if (id) {
			const { department, agents } = await APIClient.v1.get(`livechat/department/${ FlowRouter.getParam('_id') }`);
			this.department.set(department);
			this.selectedAgents.set(agents);
		}
	});
});
