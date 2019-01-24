class SocketUser
{
    constructor(pID)
    {
        this.id = pID;
    }

    setID(pID)
    {
        this.id = pID;
    }
    
    getID()
    {
        return this.id;
    }

    toString()
    {
        return '#' + this.id;
    }
}

module.exports = SocketUser;