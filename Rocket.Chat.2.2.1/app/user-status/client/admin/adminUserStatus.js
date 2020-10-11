import s from 'underscore.string';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Tracker } from 'meteor/tracker';

import { CustomUserStatus } from '../../../models';
import { TabBar, SideNav, RocketChatTabBar } from '../../../ui-utils';
import { t } from '../../../utils';

Template.adminUserStatus.helpers({
	isReady() {
		if (Template.instance().ready != null) {
			return Template.instance().ready.get();
		}
		return undefined;
	},
	customUserStatus() {
		return Template.instance().customUserStatus().map((userStatus) => {
			const { _id, name, statusType } = userStatus;
			const localizedStatusType = statusType ? t(statusType) : '';

			return {
				_id,
				name,
				statusType,
				localizedStatusType,
			};
		});
	},
	isLoading() {
		if (Template.instance().ready != null) {
			if (!Template.instance().ready.get()) {
				return 'btn-loading';
			}
		}
	},
	hasMore() {
		if (Template.instance().limit != null) {
			if (typeof Template.instance().customUserStatus === 'function') {
				return Template.instance().limit.get() === Template.instance().customUserStatus().length;
			}
		}
		return false;
	},
	flexData() {
		return {
			tabBar: Template.instance().tabBar,
			data: Template.instance().tabBarData.get(),
		};
	},
});

Template.adminUserStatus.onCreated(function() {
	const instance = this;
	this.limit = new ReactiveVar(50);
	this.filter = new ReactiveVar('');
	this.ready = new ReactiveVar(false);

	this.tabBar = new RocketChatTabBar();
	this.tabBar.showGroup(FlowRouter.current().route.name);
	this.tabBarData = new ReactiveVar();

	TabBar.addButton({
		groups: ['user-status-custom'],
		id: 'add-user-status',
		i18nTitle: 'Custom_User_Status_Add',
		icon: 'plus',
		template: 'adminUserStatusEdit',
		order: 1,
	});

	TabBar.addButton({
		groups: ['user-status-custom'],
		id: 'admin-user-status-info',
		i18nTitle: 'Custom_User_Status_Info',
		icon: 'customize',
		template: 'adminUserStatusInfo',
		order: 2,
	});

	this.autorun(function() {
		const limit = instance.limit !== null ? instance.limit.get() : 0;
		const subscription = instance.subscribe('fullUserStatusData', '', limit);
		instance.ready.set(subscription.ready());
	});

	this.customUserStatus = function() {
		const filter = instance.filter != null ? s.trim(instance.filter.get()) : '';

		let query = {};

		if (filter) {
			const filterReg = new RegExp(s.escapeRegExp(filter), 'i');
			query = { $or: [{ name: filterReg }] };
		}

		const limit = instance.limit != null ? instance.limit.get() : 0;

		return CustomUserStatus.find(query, { limit, sort: { name: 1 } }).fetch();
	};
});

Template.adminUserStatus.onRendered(() =>
	Tracker.afterFlush(function() {
		SideNav.setFlex('adminFlex');
		SideNav.openFlex();
	})
);

Template.adminUserStatus.events({
	'keydown #user-status-filter'(e) {
		// stop enter key
		if (e.which === 13) {
			e.stopPropagation();
			e.preventDefault();
		}
	},

	'keyup #user-status-filter'(e, t) {
		e.stopPropagation();
		e.preventDefault();
		t.filter.set(e.currentTarget.value);
	},

	'click .user-status-info'(e, instance) {
		e.preventDefault();
		instance.tabBarData.set(CustomUserStatus.findOne({ _id: this._id }));
		instance.tabBar.open('admin-user-status-info');
	},

	'click .load-more'(e, t) {
		e.preventDefault();
		e.stopPropagation();
		t.limit.set(t.limit.get() + 50);
	},
});
