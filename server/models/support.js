var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var supportScheme = mongoose.Schema({
	sender_user_id: {type:Schema.Types.ObjectId, ref: 'User'},
	sender_username: String,
	sender_role: String,
	sender_fname: String,
	sender_lname: String,
	support_message_content: String,
},{
	timestamps:true
});

module.exports = function(autoIncrement){
	supportScheme.plugin(autoIncrement.plugin, 
	{
		model:'Support',
		startAt: 1
	});
	return mongoose.model('Support', supportScheme);
};