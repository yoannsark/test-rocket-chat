import { Meteor } from 'meteor/meteor';

import { Messages, Rooms } from '../../app/models';

Meteor.methods({
	getLastMessages({ page, limit = 10 }) {
		if (!page && page !== 0) {
			return null;
		}

        limit = limit > 0 ? limit : 10;

		const skip = page > -1 ? limit * page : 0

		const user = Meteor.user();
		if (!user) {
			return null;
		}

		let result;
        result = Messages.findLastMessagesByUserId(user._id, skip, limit);

		const total = result.count();
		const results = result.fetch();

		results.map((message) => {
		    let roomName = ""

		    if (message.rid) {
		        const room = Rooms.findOneByIdOrName(message.rid, {
		            fields: {
		                name: 1
		            }
		        })

                roomName = room.name
            }

		    message.roomName = roomName
        })

		return {
			total,
			results,
		};
	},
});
