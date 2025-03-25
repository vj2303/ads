import React, { useState, useEffect } from 'react';

const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [adAccounts, setAdAccounts] = useState([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState(null);
  const [selectedSection, setSelectedSection] = useState('userInfo');
  const [error, setError] = useState(null);

  // Function to load the Facebook SDK
  useEffect(() => {
    const loadFbSdk = () => {
      if (window.FB) return;

      window.fbAsyncInit = function () {
        FB.init({
          appId: '750785526415113', // Replace with your actual Facebook App ID
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

  // Login with Facebook Ads permissions
  const loginWithAdsPermission = () => {
    FB.login(function (response) {
      if (response.authResponse) {
        const accessToken = response.authResponse.accessToken;
        fetchUserData(accessToken);
        fetchBusinesses(accessToken);
      } else {
        alert('Login was cancelled or failed');
      }
    }, { scope: 'ads_read, business_management', return_scopes: true });
  };

  const fetchUserData = (accessToken) => {
    const url = `https://graph.facebook.com/v22.0/me?fields=id,name,email,adaccounts&access_token=${accessToken}`;

    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        setUserData(data);
      })
      .catch((error) => {
        setError('Error fetching data');
        console.error(error);
      });
  };

  // Fetch Businesses (brand names)
  const fetchBusinesses = (accessToken) => {
    const businessesUrl = `https://graph.facebook.com/v19.0/me/businesses?fields=id,name&limit=100&access_token=${accessToken}`;

    fetch(businessesUrl)
      .then((response) => response.json())
      .then((data) => {
        setBusinesses(data.data);
      })
      .catch((error) => {
        console.error('Error fetching businesses:', error);
      });
  };

  // Fetch Ad Accounts for a selected business
  const fetchAdAccounts = (businessId, accessToken) => {
    const brandAdAccountUrl = `https://graph.facebook.com/v22.0/${businessId}/owned_ad_accounts?fields=id,name&access_token=${accessToken}`;

    fetch(brandAdAccountUrl)
      .then((response) => response.json())
      .then((data) => {
        setAdAccounts(data.data);
      })
      .catch((error) => {
        console.error('Error fetching brand ad accounts:', error);
      });
  };

  const handleBusinessSelection = (businessId) => {
    setSelectedBusinessId(businessId);
    fetchAdAccounts(businessId, userData?.accessToken);
  };

  return (
    <div className="flex">
      <div className="w-64 bg-gray-800 text-white min-h-screen p-4">
        <h2 className="text-2xl font-bold text-center mb-8">AdcreativeX</h2>
        <ul className="space-y-4">
          <li
            className="cursor-pointer hover:bg-gray-700 p-2 rounded"
            onClick={() => setSelectedSection('userInfo')}
          >
            User Info
          </li>
          <li
            className="cursor-pointer hover:bg-gray-700 p-2 rounded"
            onClick={() => setSelectedSection('businessInfo')}
          >
            Brands
          </li>
          {/* <li
            className="cursor-pointer hover:bg-gray-700 p-2 rounded"
            onClick={() => setSelectedSection('adAccountInfo')}
          >
            Ad Accounts
          </li> */}
        </ul>
      </div>

      <div className="flex-1 p-6">
        <header className="bg-blue-600 text-white p-4 mb-6">
          <h1 className="text-3xl font-bold">Facebook Ads Dashboard</h1>
        </header>

        <div className="text-gray-700">
          <button
            className="bg-blue-500 text-white py-2 px-4 rounded-md mb-6 transition-colors duration-300 hover:bg-blue-600"
            onClick={loginWithAdsPermission}
          >
            Connect with Facebook
          </button>

          {userData && selectedSection === 'userInfo' && (
            <div className="mb-6">
              <h2 className="text-xl text-orange-500 mb-4">User Info:</h2>
              <p><strong>ID:</strong> {userData.id}</p>
              <p><strong>Name:</strong> {userData.name}</p>
              <p><strong>Email:</strong> {userData.email}</p>
            </div>
          )}

          {businesses && selectedSection === 'businessInfo' && (
            <div>
              <h3 className="text-lg text-orange-500 mb-4">Brands:</h3>
              <ul className="space-y-3">
                {businesses.map((business) => (
                  <li key={business.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedBusinessId === business.id}
                      onChange={() => handleBusinessSelection(business.id)}
                      className="mr-3"
                    />
                    <label>{business.name}</label>
                  </li>
                ))}
              </ul>

              {selectedBusinessId && (
                <div className="mt-4 ml-6">
                  <h4 className="text-lg text-blue-500 mb-2">ad accounts:</h4>
                  <p className="text-sm flex flex-row">
                  <input
                      type="checkbox"
                      className="mr-3"
                    />
                    {businesses.find((business) => business.id === selectedBusinessId)?.name}
                  </p>
                </div>
              )}
            </div>
          )}






          {adAccounts && selectedSection === 'adAccountInfo' && (
            <div>
              <h3 className="text-lg text-orange-500 mb-4">Ad Accounts:</h3>
              <ul className="space-y-3">
                {adAccounts.map((adAccount) => (
                  <li key={adAccount.id} className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-3"
                    />
                    <span>{adAccount.name} (ID: {adAccount.id})</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {error && <p className="text-red-500">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
