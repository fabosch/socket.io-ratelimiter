class LimitStorage
{
    constructor(pTimePassedBetween, pMaxPerMinute)
    {
        this.timePassedBetween = pTimePassedBetween || 50;
        this.maxPerMinute = pMaxPerMinute || Number.MAX_SAFE_INTEGER;      

        this.storage = {};  
    }

    verifyAndAdd(pCallerID)
    {
        pCallerID = pCallerID + '';

        let storageAccess = this.storage;

        const dateNow = new Date;
        if(!storageAccess.hasOwnProperty(pCallerID))
        {
            storageAccess[pCallerID] = {};
            storageAccess = storageAccess[pCallerID];

            storageAccess.time_lastCall = dateNow;
            storageAccess.time_lastMinuteStart = dateNow;
            storageAccess.count_sinceLastMinuteStart = 1;

            return true;
        } else
        {
            storageAccess = storageAccess[pCallerID];

            if(dateNow.getTime() - storageAccess.time_lastCall.getTime() < this.timePassedBetween)
            {
                return false;
            }

            if(storageAccess.count_sinceLastMinuteStart + 1 > this.maxPerMinute)
            {
                if(dateNow.getTime() - storageAccess.time_lastMinuteStart.getTime() < 60 * 1000)
                {
                    return false;
                } else
                {
                    storageAccess.time_lastCall = dateNow;
                    storageAccess.time_lastMinuteStart = dateNow;
                    storageAccess.count_sinceLastMinuteStart = 1;
                    return true;
                }
            } else
            {
                storageAccess.time_lastCall = dateNow;
                storageAccess.count_sinceLastMinuteStart++;

                return true;
            }
        }
    }
}

module.exports = LimitStorage;