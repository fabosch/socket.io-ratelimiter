(function()
{
    /*
        Some normal socket stuff
    */
    const socket = io('http://127.0.0.1:8080');

    socket.on('limit_reached', () =>
    {
        console.log('I reached my limit!');
    });

    socket.on('youAreNowLoggedIn', (pMyID) =>
    {
        console.log('>> youAreNowLoggedIn', pMyID);

        socket.emit('sendData', 'Greetings', 'World');

        for(let i = 0; i < 5; i++)
        {
            socket.emit('sendData', 'Greetings', 'World #' + i); // this fails. too fast.
        }

        let testIndex = 1;
        setInterval(() =>
        {
            socket.emit('sendData', 'Greetings', 'World #' + testIndex); // this also fails after 3 times per minute. (as set in the options on the server side)
            testIndex++;
        }, 610); 
    });

    socket.on('dataReceived', (pText) =>
    {
        console.log('>> dataReceived', pText);
    });
    
    socket.on('connect', () =>
    {
        console.log('<< authenticateMePlease');
        socket.emit('authenticateMePlease');
    });
})();