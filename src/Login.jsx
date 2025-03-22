import React, { useState, useEffect } from 'react';

const Login = () => {
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);

  // Function to load the Facebook SDK
  useEffect(() => {
    // Dynamically load the Facebook SDK script
    const loadFbSdk = () => {
      if (window.FB) return; // If Facebook SDK is already loaded

      window.fbAsyncInit = function() {
        FB.init({
          appId: '750785526415113',  // Replace with your actual Facebook App ID
          cookie: true,
          xfbml: true,
          version: 'v22.0',
        });
      };

      (function(d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) return;
        js = d.createElement(s);
        js.id = id;
        js.src = 'https://connect.facebook.net/en_US/sdk.js';
        fjs.parentNode.insertBefore(js, fjs);
      })(document, 'script', 'facebook-jssdk');
    };

    loadFbSdk();
  }, []);

  // Function to fetch user details after login
  const loginWithAdsPermission = () => {
    FB.login(function(response) {
      if (response.authResponse) {
        const accessToken = response.authResponse.accessToken;

        // Make the API request to fetch user data using the access token
        fetchUserData(accessToken);
      } else {
        alert('Login was cancelled or failed');
      }
    }, { scope: 'ads_read', return_scopes: true });
  };

  // Function to make API call with access token
  const fetchUserData = (accessToken) => {
    const url = `https://graph.facebook.com/v22.0/me?fields=id,name,email,adaccounts&access_token=${accessToken}`;

    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        setUserData(data); // Store the user data
      })
      .catch((error) => {
        setError('Error fetching data');
        console.error(error);
      });
  };

  return (
    <div>
      <h1>Login with Facebook</h1>
      <button onClick={loginWithAdsPermission}>Connect with Facebook</button>

      {userData && (
        <div>
          <h2>User Info:</h2>
          <p><strong>ID:</strong> {userData.id}</p>
          <p><strong>Name:</strong> {userData.name}</p>
          <p><strong>Email:</strong> {userData.email}</p>

          <h3>Ad Accounts:</h3>
          {userData.adaccounts && userData.adaccounts.data.length > 0 ? (
            <ul>
              {userData.adaccounts.data.map((adAccount) => (
                <li key={adAccount.id}>
                  <p><strong>Account ID:</strong> {adAccount.account_id}</p>
                  <p><strong>Ad Account ID:</strong> {adAccount.id}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p>No ad accounts available.</p>
          )}
        </div>
      )}

      {error && <p>{error}</p>}
    </div>
  );
};

export default Login;
