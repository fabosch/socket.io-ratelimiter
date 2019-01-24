'use strict';

const SocketEventListener = require('./lib/SocketEventListener');

class SocketIORateLimiter
{
    constructor(pDefaultOptions)
    {
        this.defaultOptions = pDefaultOptions || {
            limit: false,           // false = inactive
            limitVersion: 'socket', // "socket" is the default "limitVersion" (It means you limit per socket connection), you can also limit per "user" (check the part about "User" for this) and "ip"

            timePassedBetween: 0,   // Min. amount of time between the same event (in ms)
            maxPerMinute: 0         // Max. amount of event calls per minute (per "limitVersion")
        };

        this.listener = {
            default: {}
        };

        this.allowLog = false;
    }

    initGroupSocket(pListenerGroup, pSocket, pUser = {})
    {
        if(pListenerGroup === undefined)
        {
            throw new Error('[initSocket] No pListenerGroup set. If you want to access the "default" group: Use "initDefaultSocket(pSocket,pUser={})"');
        }

        if(!this.listener.hasOwnProperty(pListenerGroup))
        {
            throw new Error('[initSocket] Invalid pListenerGroup');
        }

        for(let name in this.listener[pListenerGroup])
        {
            this.listener[pListenerGroup][name].initOn(pSocket, pUser);
        }
    }

    initSocket(pSocket, pUser = {})
    {
        this.initGroupSocket('default', pSocket, pUser);
    }

    registerListenerGroup(pGroupName)
    {
        this.listener[pGroupName] = {};
    }

    registerGroupListener(pListenerGroup, pName, pFunction, pOptions = false)
    {
        if(!this.listener.hasOwnProperty(pListenerGroup))
        {
            throw new Error('[registerListener] Invalid pListenerGroup');
        }

        if(this.listener[pListenerGroup].hasOwnProperty(pName))
        {
            throw new Error('[registerListener] Listener pName already exists');
        }

        let options = this.defaultOptions;
        if(pOptions !== false)
        {
            options = pOptions;
        }

        this.listener[pListenerGroup][pName] = new SocketEventListener(this, pName, pFunction, options);
    }

    registerListener(pName, pFunction, pOptions = {})
    {
        this.registerGroupListener('default', pName, pFunction, pOptions);
    }

    enableLog()
    {
        this.allowLog = true;
    }

    disableLog()
    {
        this.allowLog = false;
    }

    getLogEnabled()
    {
        return this.allowLog;
    }

    log(pText)
    {
        if(this.allowLog) console.log(pText);
    }
}

module.exports = {
    SocketIORateLimiter: SocketIORateLimiter,
    SocketUser: require('./lib/SocketUser') 
    /* There will be changes to this, you will (maybe) be able to swap out single components */
};