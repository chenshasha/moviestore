
// load the things we need
var mongoose = require('mongoose');
GLOBAL.j=0;

GLOBAL.total=0;
var fs = require('fs');
var lineList = fs.readFileSync('movies1.csv').toString().split('\n');
lineList.shift(); // Shift the headings off the list of records.

var schemaKeyList = ['id','MovieName', 'MovieBanner', 'ReleaseDate', 'RentAmt','AvlCopies','category'];

// define the schema for our user model
var movieSchema = mongoose.Schema({
        id        	 		: Number,
        MovieName    		: String,
        MovieBanner  		: String,
        ReleaseDate  		: Number,
        RentAmount   		: Number,
        AvailableCopies     : Number,
        category     		: String
});

var RepOppDoc = mongoose.model('Movie', movieSchema);
/*
console.log('Database loading started');

RepOppDoc.collection.remove(function(err, p){
    if(err){ 
        throw err;
    }
});


function createDocRecurse (err) {
    if (err) {
        console.log(err);
        process.exit(1);
    }
    if (lineList.length) {
        var line = lineList.shift();
        var doc = new RepOppDoc();	
        line.split(',').forEach(function (entry, i) {
            doc[schemaKeyList[i]] = entry;
            //console.log(entry);
        });
        //j=j+1;
        //console.log(j);
        doc.save(createDocRecurse);
    } else {
        // After the last entry query to show the result.
        console.log('Database load complete');
    }
}

createDocRecurse(null);
*/

// methods ======================

// create the model for movie and expose it to our app
module.exports = mongoose.model('Movie', movieSchema);









