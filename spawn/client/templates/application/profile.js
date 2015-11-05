Template.profilePage.helpers({
	tasks: function () {
 		return Tasks.find({host: {$in: [Meteor.user().username, Meteor.user().profile.name]}}, {sort: {createdAt: -1}});
	}
});