class SocketEventListenerDataPacket
{
    constructor(pLogFunction, pSocket, pUser = {})
    {
        this.socket = pSocket;
        this.user = pUser;

        this.logFunc = pLogFunction;
    }

    getSocket()
    {
        return this.socket;
    }

    getUser()
    {
        return this.user;
    }

    log()
    {
        this.logFunc(...arguments);
    }
}

module.exports = SocketEventListenerDataPacket;