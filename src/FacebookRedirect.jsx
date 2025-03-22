// FacebookRedirect.js
import React, { useEffect, useState } from 'react';

const FacebookRedirect = () => {
    const [code, setCode] = useState(null);

    useEffect(() => {
        // Extract the 'code' query parameter from the URL
        const urlParams = new URLSearchParams(window.location.search);
        const codeFromUrl = urlParams.get('code');  // Extract the 'code' parameter

        if (codeFromUrl) {
            setCode(codeFromUrl); // Store the code in state
            console.log('Authorization Code:', codeFromUrl);

            // Store the extracted code in local storage
            localStorage.setItem('facebookAuthCode', codeFromUrl);

            // Create a downloadable file with the extracted code
            const blob = new Blob([JSON.stringify({ code: codeFromUrl })], { type: 'application/json' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'facebookAuthCode.json';  // Name of the file to download
            link.click();  // Trigger the download automatically
        } else {
            console.log('No authorization code found');
        }
    }, []);

    return (
        <div>
            <h1>Facebook OAuth Redirect</h1>
            {code ? (
                <div>
                    <p>Authorization Code: {code}</p>
                    <p>You can now use this code to exchange for an access token.</p>
                </div>
            ) : (
                <p>Waiting for the authorization code...</p>
            )}
        </div>
    );
};

export default FacebookRedirect;
