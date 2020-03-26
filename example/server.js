const { SocketIORateLimiter, SocketUser } = require('../index'); // require('socket.io-ratelimiter') for you
const socketIO = require('socket.io');

class CustomRateLimiter extends SocketIORateLimiter
{
    /**
     * Override this method to send a response when a socket reaches it's limit
     * @param {*} pSocket 
     * @param {*} pListenerName 
     */
    socketLimitReached(pSocket, pListenerName)
    {
        console.log('A socket reached it\'s limit with listener: ' + pListenerName);

        pSocket.emit('limit_reached', null);
    }
}

const rateLimiter = new CustomRateLimiter;
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
        maxPerMinute: 3         // Max. amount of event calls per minute (per "limitVersion", not globally)
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
        rateLimiter.initSocket(pSocket, {}, true); // The socket will now get the events previously registered in the SocketIORateLimiter
                                                   // No user passed
                                                   // true: "initSocket" event gets rate limited
    });
}

console.log('[Main] Initializing...');
init();