var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var argumentScheme = mongoose.Schema({
	treeStructureUpdatedAt: Date,
	disc_id: {type:Schema.Types.ObjectId, ref: 'Discussion'},
	parent_id: {type:Number, ref: 'Argument'},
	main_thread_id: {type:Number, ref:'Argument'},
	user_id: {type:Schema.Types.ObjectId, ref: 'User'},
	username: String,
	role: String,
	fname: String,
	lname: String,
	color: String,
	content: String,
	depth: Number,
	hidden: Boolean,
	trimmed: Boolean,
	sub_arguments: [{type:Number, ref: 'Argument'}],
	isReflection: Boolean,
	reflectionParts: [{ start:Number, end:Number, refArgId:{type:Number, ref: 'Argument'}}],
	cloned: Boolean,
	sourceTrimmedId: {type:Number, ref: 'Argument', default: 0},

},{
	timestamps:true
});

module.exports = function(autoIncrement){
	argumentScheme.plugin(autoIncrement.plugin, 
	{
		model:'Argument',
		startAt: 1
	});
	return mongoose.model('Argument', argumentScheme);
};