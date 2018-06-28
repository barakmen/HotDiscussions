(function () {
    angular.module('tree.service', ['tree.factory'])
        .service("TreeService", function () {
          
            var getPostDataFromArg = function(argumentText, parentId, depth, main_thread_id, role, isReflaction = false){
                // console.log('sending the new arg AJAX..');
                // console.log("by role--> " + role);
                var new_main_thread_id;
                if (!depth){
                    new_main_thread_id = 0;
                }
                else if (depth === 1){
                    new_main_thread_id = parentId;
                }
                else{
                    new_main_thread_id = main_thread_id;
                }
                // console.log(new_main_thread_id);

                //extract the quotes from the text of the argument
                var quotesFromThePAD = [];
                if(argumentText){
                    var contentArr = $.parseHTML(argumentText);
                    contentArr.filter(el => el.tagName === 'BUTTON').forEach(el => {
                        var cordinates = el.outerHTML.substring(el.outerHTML.indexOf('(') + 1,el.outerHTML.indexOf(')')).split(',');
                        cordinates[0] = parseInt(cordinates[0]);
                        cordinates[1] = parseInt(cordinates[1]);
                        quotesFromThePAD.push({start:cordinates[0], end:cordinates[1]});
                    });
                }

                var postData = {
                    content: argumentText,
                    parent_id: parentId,
                    depth: depth,
                    main_thread_id: new_main_thread_id,
                    role:role,
                    quotesFromThePAD: quotesFromThePAD,
                    isReflaction:isReflaction
                };
                return postData;
            };

            this.postNewArgument = function(socket, argumentText, parentId, depth, main_thread_id, role, isReflaction = false){
                var postData = getPostDataFromArg(argumentText, parentId, depth, main_thread_id, role, isReflaction);
                socket.emit('submitted-new-argument', postData);
            };

            this.postNewReflactionArgumentAndReplay = function(socket, argumentText, parentId, depth, main_thread_id, role, replayText, sourceId, sourceStart, sourceEnd, isReflaction = true){
                var postData = getPostDataFromArg(argumentText, parentId, depth, main_thread_id, role, isReflaction);
                postData['replayText'] = replayText;
                postData['sourceId'] = sourceId;
                postData['sourceStart'] = sourceStart;
                postData['sourceEnd'] = sourceEnd;
                socket.emit('submitted-new-reflaction-argument-and-replay', postData);
            };
        });
})();