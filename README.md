# Socket.IO-ratelimiter

## This project is not directly affiliated with "socket.io" (Not official)

## How to use:
The module.exports (= require('socket.io-ratelimiter')) currently include the SocketIORateLimiter class and the SocketUser class
```javascript
const { SocketIORateLimiter, SocketUser } = require('socket.io-ratelimiter'); // The current components

const rateLimiter = new SocketIORateLimiter(); // ratelimiter instance with no default options
```
SocketIORateLimiter comes with some functions that will handle registering listeners and initializing them on socket.io sockets
1. Since you manage the socket.io events through the ratelimiter instance you will have to pass new connected socket.io socket instances to the initSocket function, it will initialize the default event listeners on it.
```javascript
// socket = a socket.io socket instance
// user = (Optional) An object instance that returns an (unique) id via the getID() function. This will get passed to the SocketEventListenerDataPacket instance, accessable            with the getUser() function. You can use the SocketUser class here.
rateLimiter.initSocket(socket, user);
```
2. You will have to register socket events in the rateLimiter instance.
This will register an event listener in the 'default' "group", all sockets will get this event when initialized with rateLimiter.initSocket()
```javascript
// eventName = The event name, like 'sendData' etc. (the normal socket.io event name)
// callbackFunction = function(dataPacket, ...theEventArgsYouPassed){}, the function that will get called when the event gets emitted
//      dataPacket = SocketEventListenerDataPacket instance, has the getSocket(), getUser(), and log() functions. getUser will return the user when the listener got initialized with one
// options = (Optional, will fallback to the rateLimiter default options passed in the constructor, the built-in default options disable ratelimiting) {   
    //     justOnce: boolean whether socket.on or socket.once should be used (true will result in only calling the listener the first time the event gets emitted on this   socket),  
    //     limit: boolean that activates or deactives rate-limiting,
    //     limitVersion: 'socket' | 'user' | 'ip', "socket" will ratelimit per socket, "user" will ratelimit per (some passed user).getID(), "ip" will ratelimit per IP
    // 
    //     timePassedBetween: Min. time in ms (Integer) between event calls. Will block any faster calls,
    //     maxPerMinute: Max. amount (Integer) of event calls per minute (per "limitVersion", not globally)
    // }
rateLimiter.registerListener(eventName, callbackFunction, options);
```
3. You can also create "groups" (like namespaces or rooms). You will have to register the group at first before trying to assign listeners to it. The default group is "default".
```javascript
// listenerGroupName = The name of the listener group (String)
rateLimiter.registerListenerGroup(listenerGroupName);
```
4. You then can then initialize sockets on the listeners of a listener group
```javascript
// listenerGroupName = The name of the listener group (String)
// socket = The socket.io socket instance
// user = (Optional) An object instance that returns an (unique) id via the getID() function. This will get passed to the SocketEventListenerDataPacket instance, accessable            with the getUser() function. You can use the SocketUser class here.
rateLimiter.initGroupSocket(listenerGroupName, socket, user);
```
5. And this is how you register listeners to a certain group
```javascript
// listenerGroupName = The name of the listener group (String)
// The rest is the same as for the normal registerListener() function
rateLimiter.registerGroupListener(listenerGroupName, eventName, callbackFunction, options);
```

### Additional functions
- enableLog()
Enables logging. Is disabled by default.
- disableLog()
Disables logging
- getLogEnabled()
Returns whether logging is enabled or not (boolen)
- log(text)
Calls console.log(text) when logging is enabled. The socket event listeners log via this function, feel free to override this method (by extending the SocketIORateLimiter class)

### SocketEventListenerDataPacket
Has 3 Functions
- getSocket()
Returns the socket.io socket
- getUser()
Returns the user instance (if you passed one when initializing), returns an empty object ({}) by default.
- log(text)
This is a log function that will add "[(the listener name)] " infront of your message. E.g. for a "sendData" event listener: "\[sendData\] (Text here ...)" 
You need to enable logging with (rateLimiter instance).enableLog() first. You can also extend the SocketIORateLimiter class and override it's "log()" function, it performs the logging to the console.

## Complete Example (also found in /example/):

```javascript
const { SocketIORateLimiter, SocketUser } = require('socket.io-ratelimiter');
const socketIO = require('socket.io');

const rateLimiter = new SocketIORateLimiter;
const io = socketIO.listen(8080);

function registerNormalListeners()
{
    /* Default listener, will get registered to sockets by default (registerListener) */
    rateLimiter.registerListener('authenticateMePlease' /* Example event name */, (dataPacket /*, ... Your normal args you passed in the event emit will follow here */) =>
    {
        const socket = dataPacket.getSocket();  // The normal socket.io socket 

        // const user = dataPacket.getUser(); (User is {} here, no user was passed to the initSocket function);

        /* 
            This is a log function that will add "[( the listener name )] " infront of your message.
            You need to enable logging with rateLimiter.enableLog() first. You can also extend the SocketIORateLimiter class and override it's "log()" function, 
             it performs the logging to the console.
        */
        dataPacket.log('Received authenticateMePlease by ' + socket.id);

        // .... 

        /* In case you authenticate the socket somehow */
        const user = new SocketUser('347832'); // some ID
        rateLimiter.initGroupSocket('loggedIn' /* The group name used for the authenticated sockets (for example) */, socket, user);  // You can use any object that returns an (unique) id via the getID() function. (For "user")

        socket.emit('youAreNowLoggedIn', user.getID());
    },
    {     // these options are optional, you can leave them out to disable the ratelimiting
        justOnce: true,         // If you enable this, then the eventlistener will get assigned to the socket via the "once" function. Is false by default, you can leave this out
        limit: true,            // Enables limiting
        limitVersion: 'ip',     // Will limit per IP, other options are: 'socket' (will limit per socket) and 'user' (will limit per "(some passed user).getID()")

        timePassedBetween: 750, // Min. amount of time between the same event (in ms)
        maxPerMinute: 3         // Max. amount of event calls per minute (per "limitVersion")
    });
}

function registerGroupedListeners()
{
    /* 
        You can also assign listeners to certain "groups", e.g. groups that manage all sockets with extended access rights like authenticated users etc..
        Everything stays the same (apart from the first argument)
    */

    /*
        This step is required (once for each group), otherwise it will throw an error stating that the listenerGroupName you passed is invalid. 
    */
    rateLimiter.registerListenerGroup('loggedIn'/* Example group name */);

    rateLimiter.registerGroupListener('loggedIn', 'sendData' /* Example event name */, (dataPacket, pDataOne, pDataTwo) => 
    { 
        const socket = dataPacket.getSocket();
        const user = dataPacket.getUser(); // the user passed in rateLimiter.initGroupSocket('loggedIn');

        dataPacket.log('Received some data by ' + user.toString() + ': ' + pDataOne + ' and: ' + pDataTwo);  // toString(): The default SocketUser returns '#' + (it's id) 

        socket.emit('dataReceived', 'thanks');
    },
    {
        justOnce: false,
        limit: true,
        limitVersion: 'user',

        timePassedBetween: 600, // 600ms
        maxPerMinute: 3
    });
}

function init()
{
    rateLimiter.enableLog();

    registerNormalListeners();
    registerGroupedListeners();

    io.on('connection', (pSocket) =>
    {
        rateLimiter.initSocket(pSocket); // The socket will now get the events previously registered in the SocketIORateLimiter
    });
}

console.log('[Main] Initializing...');
init();
```