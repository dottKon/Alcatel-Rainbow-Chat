$(function() {

    var applicationID = "aada74407ab611e8851d71b651e24671", 
        applicationSecret = "OhvxXAB9IimgPXbbDcKD5i8jovmUtxuVLWZK9InjIWyQwIsisb3wvFlzzXkEOT4u";

    angular.bootstrap(document, ["sdk"]).get("rainbowSDK");


    //WAIT FOR RAINBOW SDK AND ALLOW TO LOGIN ONLY WHEN IT'S READY
    var onReady = function onReady() {
        $("#loginForm").submit(function logIn(){
            var myRainbowLogin = document.getElementById("username").value;
            var myRainbowPassword = document.getElementById("password").value; 
            $('#signInButton').attr('disabled', true);
            rainbowSDK.connection.signin(myRainbowLogin, myRainbowPassword)
            .then(function(account) {
                $("#login").css("display", "none");
                document.getElementById("nameDisplayed").innerHTML = myRainbowLogin;
                populateContactList();
            })
            .catch(function(err) {
                console.log('problem logging in');
                document.getElementById('status').innerHTML = 'Login and/or password invalid. Try again!';
                $('#signInButton').attr('disabled', false);
                
            });


        });

    $(document).on(rainbowSDK.RAINBOW_ONREADY, onReady);

    };

    // POPULATE THE CONTACT LIST
    function populateContactList(){
        var contactList = rainbowSDK.contacts.getAll();
        for (var i = 0; i < contactList.length; i++) {
            var contactId = contactList[i].dbId;
            var newContact = $("<div onclick=\"onContactSelected('" + contactId + "')\" id='"+ contactId + "'>" + contactList[i]._displayName + "</div>")
            $('#contactList').append(newContact);
        }


    }


    var onConnectionStateChangeEvent = function onConnectionStateChangeEvent(event, status) {
        var statusId = document.getElementById('status'); 
        switch(status) {
            case rainbowSDK.connection.RAINBOW_CONNECTIONCONNECTED:
                // The state of the connection has changed to "connected" which means that your application is now connected to Rainbow
                console.log('STATUS: CONENCTED');
                statusId.innerHTML = "CONNECTED"
                break;
            case rainbowSDK.connection.RAINBOW_CONNECTIONINPROGRESS:
                // The state of the connection is now in progress which means that your application try to connect to Rainbow
                console.log('STATUS: IN PROGRESS');
                statusId.innerHTML = "CONNECTION IN PROGRESS";

                break;
            case rainbowSDK.connection.RAINBOW_CONNECTIONDISCONNECTED:
                // The state of the connection changed to "disconnected" which means that your application is no more connected to Rainbow
                console.log('STATUS: DISCONNECTED');
                break;
            default:
                break;
        };
   
    };


    $(document).on(rainbowSDK.connection.RAINBOW_ONCONNECTIONSTATECHANGED, onConnectionStateChangeEvent);




    var onLoaded = function onLoaded() {
        rainbowSDK.initialize(applicationID, applicationSecret).then(function() {
            console.log("Rainbow SDK is initialized!");
        }).catch(function(err) {
            console.log("Something went wrong with the SDK...", err);
        });
    };


    $(document).on(rainbowSDK.RAINBOW_ONREADY, onReady);
    $(document).on(rainbowSDK.RAINBOW_ONLOADED, onLoaded);
    rainbowSDK.load();

    var Call = angular.element(document.querySelector('body')).injector().get('Call');
    var Contact = angular.element(document.querySelector('body')).injector().get('Contact');
    var Conversation = angular.element(document.querySelector('body')).injector().get('Conversation');









});


var selectedContact = null;
var associatedConversation = null;

//ACTIONS TO PERFORM WHEN SELECTING THE CONTACT
function onContactSelected(contactId) {
    selectedContact = rainbowSDK.contacts.getContactById(contactId);

    //UPDATE THE CONVERSATION HEADER ELEMENT
    var header = document.getElementById("conversationHeader");
    header.innerHTML = "Conversation with <b>" + selectedContact._displayName + "</b>" ;

    //MARK CONTACT ON THE CONTACT LIST AS ACTIVE
    $("#" + contactId).addClass("active");

    //POPULATE THE LAST 100 MESSAGES FROM THE CONVERSATION
    rainbowSDK.conversations.openConversationForContact(selectedContact).then(function(conversation) {
        associatedConversation = conversation;
        var lastMessage = associatedConversation.lastMessageText;
        var currentPage = 0;
    
        rainbowSDK.im.getMessagesFromConversation(associatedConversation, 100).then(function() {

            var history = associatedConversation.messages;
            
            //call the function to update the view
            updateView(history);

            //Update the view after sending a new message
            $("#form").submit(function() { 
                messageContent = $('#m').val();
                rainbowSDK.im.sendMessageToConversation(associatedConversation, messageContent);
                $('#m').val('');

                //Calling the function that uses API in order to make sure the conversation is up to date
                updateView(history);
                return false;
            });

            if(!associatedConversation.historyComplete) {
            }
        });
        

        // LOADING THE MESSAGES IN THE CHAT WINDOW
        function updateView(history){
            $('#messages').children($('<div>')).remove();

            for (var i = 0; i < history.length; i++){
                var guestMessage = $("<div class=\"leftSideMessage\">" + history[i].data + "</div><p>");
                var hostMessage = $("<div class=\"rightSideMessage\">" + history[i].data + "</div><p>");
                if(history[i].side === "L") {
                    $('#messages').append(guestMessage);
                } else {
                    $('#messages').append(hostMessage);
                }
                var elem = document.getElementById('chatMessages');
                elem.scrollTop = elem.scrollHeight; 
                
            }

        };

        //RECEIVING A NEW MESSAGE
        var onNewMessageReceived = function(event, message, conversation) {
            rainbowSDK.im.markMessageFromConversationAsRead(associatedConversation, message);
            var guestMessage = $("<div class=\"leftSideMessage\">" + message.data + "</div><p>");
            var hostMessage = $("<div class=\"rightSideMessage\">" + message.data + "</div><p>");

            if(message.side === "L") {
                $('#messages').append(guestMessage);
            } else {
                $('#messages').append(hostMessage);
            }
            var elem = document.getElementById('chatMessages');
            elem.scrollTop = elem.scrollHeight; 
        }; 

        $(document).on(rainbowSDK.im.RAINBOW_ONNEWIMMESSAGERECEIVED, onNewMessageReceived);

    }).catch(function(err) {
        console.log(err);
    });




    //USE ONLY WHEN NO CONTACT FOUND 
    if(!selectedContact) {
        rainbowSDK.contacts.searchById(contactId).then(function(contact) {
            selectedContact = contact;
            if(selectedContact) {
            }
            else {
                console.log('some error');
            }

        }).catch(function(err) {
            console.log(err);
        });;
    }
}

//REFRESH PAGE IN ORDER TO SIGN OUT - ARBITRARY SOLUTION GOOD ENOUGH FOR THE PROJECT
function signOut(){
    location.reload();
}
