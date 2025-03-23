import React, { useState, useEffect } from 'react';

const Login = () => {
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [businesses, setBusinesses] = useState([]);

  // Function to load the Facebook SDK
  useEffect(() => {
    const loadFbSdk = () => {
      if (window.FB) return;

      window.fbAsyncInit = function () {
        FB.init({
          appId: '750785526415113',  // Replace with your actual Facebook App ID
          cookie: true,
          xfbml: true,
          version: 'v22.0',
        });
      };

      (function (d, s, id) {
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

  const loginWithAdsPermission = () => {
    FB.login(function (response) {
      if (response.authResponse) {
        const accessToken = response.authResponse.accessToken;
        fetchUserData(accessToken);
        fetchBusinesses(accessToken); // Fetch businesses after successful login
      } else {
        alert('Login was cancelled or failed');
      }
    }, { scope: 'ads_read, business_management', return_scopes: true }); // Added business_management to scope
  };

  const fetchUserData = (accessToken) => {
    const url = `https://graph.facebook.com/v22.0/me?fields=id,name,email,adaccounts&access_token=${accessToken}`;

    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        setUserData(data);
        if (data.adaccounts && data.adaccounts.data.length > 0) {
          fetchAdAccountDetails(data.adaccounts.data, accessToken);
        }
      })
      .catch((error) => {
        setError('Error fetching data');
        console.error(error);
      });
  };

  // Fetch businesses (brand names)
  const fetchBusinesses = (accessToken) => {
    const businessesUrl = `https://graph.facebook.com/v2.0/me/businesses?fields=id,name&access_token=${accessToken}`;

    fetch(businessesUrl)
      .then((response) => response.json())
      .then((data) => {
        setBusinesses(data.data); // Set the list of businesses (brand names)
      })
      .catch((error) => {
        console.error('Error fetching businesses:', error);
      });
  };

  // Function to fetch ad account details
  const fetchAdAccountDetails = (adAccounts, accessToken) => {
    adAccounts.forEach((adAccount) => {
      const adAccountUrl = `https://graph.facebook.com/v22.0/${adAccount.id}?fields=name,account_id&access_token=${accessToken}`;

      fetch(adAccountUrl)
        .then((response) => response.json())
        .then((adAccountData) => {
          adAccount.name = adAccountData.name;
          adAccount.account_name = adAccountData.account_id;

          // Map brand name to the ad account based on business ID
          const brand = businesses.find((business) => business.id === adAccountData.business?.id);
          adAccount.brand_name = brand ? brand.name : "No Brand";

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

  const handleAccountSelection = (event, adAccountId) => {
    if (event.target.checked) {
      setSelectedAccounts([...selectedAccounts, adAccountId]);
    } else {
      setSelectedAccounts(selectedAccounts.filter((id) => id !== adAccountId));
    }
  };

  const handleSelectAllChange = (event) => {
    if (event.target.checked) {
      setSelectedAccounts(userData?.adaccounts?.data.map(account => account.id) || []);
    } else {
      setSelectedAccounts([]);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <button style={styles.button} onClick={loginWithAdsPermission}>
          Connect with Facebook
        </button>

        {userData && (
          <div style={styles.userInfo}>
            <h2 style={styles.subheading}>User Info:</h2>
            <p><strong>ID:</strong> {userData.id}</p>
            <p><strong>Name:</strong> {userData.name}</p>
            <p><strong>Email:</strong> {userData.email}</p>

            <h3 style={styles.subheading}>Ad Accounts:</h3>
            <div style={styles.checkboxContainer}>
              <input
                type="checkbox"
                checked={selectedAccounts.length === userData.adaccounts.data.length}
                onChange={handleSelectAllChange}
                style={styles.checkbox}
              />
              <label>Select All</label>
            </div>

            {userData.adaccounts && userData.adaccounts.data.length > 0 ? (
              userData.adaccounts.data.map((adAccount) => (
                <div key={adAccount.id} style={styles.accountItem}>
                  <input
                    type="checkbox"
                    checked={selectedAccounts.includes(adAccount.id)}
                    onChange={(e) => handleAccountSelection(e, adAccount.id)}
                    style={styles.checkbox}
                  />
                  <label>
                    {adAccount.brand_name} ({adAccount.account_name}) {/* Display Brand Name and Account ID */}
                  </label>
                </div>
              ))
            ) : (
              <p>No ad accounts available.</p>
            )}
          </div>
        )}

        {error && <p>{error}</p>}
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#f0f8ff',
  },
  card: {
    padding: '20px',
    backgroundColor: '#fff',
    borderRadius: '10px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    width: '300px',
    textAlign: 'center',
    fontFamily: 'Arial, sans-serif',
  },
  subheading: {
    color: '#FF6347',
    marginBottom: '10px',
  },
  button: {
    backgroundColor: '#007BFF',
    color: '#fff',
    padding: '10px 20px',
    borderRadius: '5px',
    border: 'none',
    cursor: 'pointer',
    marginBottom: '20px',
    transition: 'background-color 0.3s',
  },
  checkboxContainer: {
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkbox: {
    marginRight: '10px',
  },
  accountItem: {
    marginLeft: '20px',
    marginBottom: '10px',
    textAlign: 'left',
  },
  userInfo: {
    marginTop: '20px',
    color: '#333',
  }
};

export default Login;
