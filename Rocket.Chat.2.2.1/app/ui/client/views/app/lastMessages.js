import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import _ from 'underscore';

import { timeAgo } from './helpers';
import { t } from '../../../../utils';
import './lastMessages.html';

function lastMessagesSearch(config, cb) {
	return Meteor.call('getLastMessages', config, (err, result) => {
		cb(result && result.results && result.results.length && result.results.map((result) => {
		    return {
                roomName: result.roomName,
                messageContent: result.msg,
                date: timeAgo(result.ts, t)
            };
		}));
	});
}

Template.lastMessages.helpers({
	searchResults() {
		return Template.instance().results.get();
	},
	isLoading() {
		return Template.instance().isLoading.get();
	},
	onTableScroll() {
		const instance = Template.instance();
		if (instance.isLoading.get() || instance.end.get()) {
			return;
		}
		return function(currentTarget) {
			if (currentTarget.offsetHeight + currentTarget.scrollTop >= currentTarget.scrollHeight - 100) {
				return instance.page.set(instance.page.get() + 1);
			}
		};
	},
    onTableResize() {
        const { limit } = Template.instance();

        return function() {
            // Set limit with the height of the table per the size of 1 row
            limit.set(Math.ceil(this.$('.table-scroll').height() / 24));
        };
    },
});

Template.lastMessages.onRendered(function() {
	function setResults(result) {
		if (!Array.isArray(result)) {
			result = [];
		}

		if (this.page.get() > 0) {
			return this.results.set([...this.results.get(), ...result]);
		}

		return this.results.set(result);
	}

	this.autorun(() => {
        const searchConfig = {
			limit: this.limit.get(),
			page: this.page.get(),
		};

		if (this.end.get() || this.loading) {
			return;
		}

		this.loading = true;
		this.isLoading.set(true);

		lastMessagesSearch(searchConfig, (result) => {
			this.loading = false;
			this.isLoading.set(false);
			this.end.set(!result);

			setResults.call(this, result);
		});
	});
});

Template.lastMessages.onCreated(function() {
	this.limit = new ReactiveVar(0);
	this.page = new ReactiveVar(0);
	this.end = new ReactiveVar(false);

	this.results = new ReactiveVar([]);
	this.isLoading = new ReactiveVar(false);
});
