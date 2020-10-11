import { Meteor } from 'meteor/meteor';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import s from 'underscore.string';

import { hasPermission } from '../../app/authorization';
import { Rooms, Users } from '../../app/models';
import { settings } from '../../app/settings/server';
import { getFederationDomain } from '../../app/federation/server/lib/getFederationDomain';
import { isFederationEnabled } from '../../app/federation/server/lib/isFederationEnabled';
import { federationSearchUsers } from '../../app/federation/server/handler';

const sortChannels = function(field, direction) {
	switch (field) {
		case 'createdAt':
			return {
				ts: direction === 'asc' ? 1 : -1,
			};
		default:
			return {
				[field]: direction === 'asc' ? 1 : -1,
			};
	}
};

const sortUsers = function(field, direction) {
	switch (field) {
		default:
			return {
				[field]: direction === 'asc' ? 1 : -1,
			};
	}
};

Meteor.methods({
	browseChannels({ text = '', workspace = '', type = 'channels', sortBy = 'name', sortDirection = 'asc', page, offset, limit = 10 }) {
		const regex = new RegExp(s.trim(s.escapeRegExp(text)), 'i');

		if (!['channels', 'users'].includes(type)) {
			return;
		}

		if (!['asc', 'desc'].includes(sortDirection)) {
			return;
		}

		if ((!page && page !== 0) && (!offset && offset !== 0)) {
			return;
		}

		if (!['name', 'createdAt', 'usersCount', ...type === 'channels' ? ['usernames'] : [], ...type === 'users' ? ['username'] : []].includes(sortBy)) {
			return;
		}

		const skip = Math.max(0, offset || (page > -1 ? limit * page : 0));

		limit = limit > 0 ? limit : 10;

		const pagination = {
			skip,
			limit,
		};

		const canViewAnonymous = settings.get('Accounts_AllowAnonymousRead') === true;

		const user = Meteor.user();

		if (type === 'channels') {
			const sort = sortChannels(sortBy, sortDirection);
			if ((!user && !canViewAnonymous) || (user && !hasPermission(user._id, 'view-c-room'))) {
				return;
			}

			const result = Rooms.findByNameAndType(regex, 'c', {
				...pagination,
				sort,
				fields: {
					description: 1,
					topic: 1,
					name: 1,
					lastMessage: 1,
					ts: 1,
					archived: 1,
					usersCount: 1,
				},
			});

			return {
				total: result.count(), // count ignores the `skip` and `limit` options
				results: result.fetch(),
			};
		}

		// non-logged id user
		if (!user) {
			return;
		}

		// type === users
		if (!hasPermission(user._id, 'view-outside-room') || !hasPermission(user._id, 'view-d-room')) {
			return;
		}

		const exceptions = [user.username];

		const forcedSearchFields = workspace === 'all' && ['username', 'name', 'emails.address'];

		const options = {
			...pagination,
			sort: sortUsers(sortBy, sortDirection),
			fields: {
				username: 1,
				name: 1,
				createdAt: 1,
				emails: 1,
				federation: 1,
			},
		};

		let result;
		if (workspace === 'all') {
			result = Users.findByActiveUsersExcept(text, exceptions, options, forcedSearchFields);
		} else if (workspace === 'external') {
			result = Users.findByActiveExternalUsersExcept(text, exceptions, options, forcedSearchFields, getFederationDomain());
		} else {
			result = Users.findByActiveLocalUsersExcept(text, exceptions, options, forcedSearchFields, getFederationDomain());
		}

		const total = result.count(); // count ignores the `skip` and `limit` options
		const results = result.fetch();

		// Try to find federated users, when appliable
		if (isFederationEnabled() && type === 'users' && workspace === 'external' && text.indexOf('@') !== -1) {
			const users = federationSearchUsers(text);

			for (const user of users) {
				if (results.find((e) => e._id === user._id)) { continue; }

				// Add the federated user to the results
				results.unshift({
					username: user.username,
					name: user.name,
					emails: user.emails,
					federation: user.federation,
					isRemote: true,
				});
			}
		}

		return {
			total,
			results,
		};
	},
});

DDPRateLimiter.addRule({
	type: 'method',
	name: 'browseChannels',
	userId(/* userId*/) {
		return true;
	},
}, 100, 100000);
