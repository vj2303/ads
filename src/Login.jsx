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
        if (data.adaccounts && data.adaccounts.data.length > 0) {
          // Fetch ad account details for each account ID
          fetchAdAccountDetails(data.adaccounts.data, accessToken);
        }
      })
      .catch((error) => {
        setError('Error fetching data');
        console.error(error);
      });
  };

  // Function to fetch ad account details (brand names and ad account names)
  const fetchAdAccountDetails = (adAccounts, accessToken) => {
    adAccounts.forEach((adAccount) => {
      const adAccountUrl = `https://graph.facebook.com/v22.0/${adAccount.id}?fields=name,account_id&access_token=${accessToken}`;

      fetch(adAccountUrl)
        .then((response) => response.json())
        .then((adAccountData) => {
          adAccount.name = adAccountData.name;
          adAccount.account_name = adAccountData.account_id;

          // Update user data with ad account details
          setUserData((prevState) => ({
            ...prevState,
            adaccounts: {
              data: prevState.adaccounts.data.map((account) =>
                account.id === adAccount.id ? adAccount : account
              ),
            },
          }));
        })
        .catch((error) => {
          console.error('Error fetching ad account details:', error);
        });
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
                  <p><strong>Ad Account ID:</strong> {adAccount.id}</p>
                  <p><strong>Account Name:</strong> {adAccount.name}</p>
                  <p><strong>Brand Name (Account ID):</strong> {adAccount.account_name}</p>
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
