const SocketEventListenerDataPacket = require('./SocketEventListenerDataPacket');
const LimitStorage = require('./LimitStorage');

class SocketEventListener
{
    constructor(pManager, pName, pFunction, pOptions = {})
    {   
        this.manager = pManager;
        this.name = pName;
        this.func = pFunction;

        this.justOnce = pOptions.justOnce || false;

        this.limit = pOptions.limit || false;
        this.limitVersion = pOptions.limitVersion || 'socket'; 
        
        this.limitStorage = new LimitStorage(pOptions.timePassedBetween, pOptions.maxPerMinute);
    }

    initOn(pSocket, pUser = false)
    {
        const functionName = (this.justOnce) ? 'once' : 'on';
        pSocket[functionName](this.name, async (...args) =>
        {
            if(this.limit)
            {   
                let callerID;
                switch(this.limitVersion.toLowerCase())
                {
                    case 'socket':
                        callerID = 'socket_' + pSocket.id;
                        break;

                    case 'user':
                        if(pUser === false)
                        {
                            throw new Error('[' + this.name +'] Limited per user, but no user passed');
                        }
                        callerID = 'user_' + pUser.getID();
                        break;

                    case 'ip':
                        callerID = 'ip_' + pSocket.request.socket.remoteAddress;
                        break;
                        
                    default:
                        throw new Error('[' + this.name +'] Limited per "' + this.limitVersion.toLowerCase() + '", that option is invalid though');
                        break;
                }

                if(!this.limitStorage.verifyAndAdd(callerID))
                {
                    return this.manager.socketLimitReached(pSocket, this.name);
                }
            }

            this.func(new SocketEventListenerDataPacket((...argsLog) =>
            {
                this.log(...argsLog);
            }, pSocket, pUser), ...args);
        });
    }

    log(pText)
    {
        this.manager.log('[' + this.name + '] ' + pText);
    }
}

module.exports = SocketEventListener;