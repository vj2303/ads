import React, { useState, useEffect } from 'react';

const Login = () => {
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [adAccounts, setAdAccounts] = useState([]);
  const [selectedSection, setSelectedSection] = useState('userInfo');
  const [visibleBusinesses, setVisibleBusinesses] = useState({});
  const [selectedAdAccounts, setSelectedAdAccounts] = useState([]);

  // Facebook SDK initialization
  useEffect(() => {
    const loadFbSdk = () => {
      if (window.FB) return;

      window.fbAsyncInit = function () {
        FB.init({
          appId: '750785526415113',
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

  // Login with Ads Permission
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

  // Fetch User Data
  const fetchUserData = (accessToken) => {
    const url = `https://graph.facebook.com/v22.0/me?fields=id,name,email&access_token=${accessToken}`;

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

  // Fetch Businesses
  const fetchBusinesses = (accessToken) => {
    const businessesUrl = `https://graph.facebook.com/v19.0/me/businesses?fields=id,name&limit=100&access_token=${accessToken}`;

    fetch(businessesUrl)
      .then((response) => response.json())
      .then((data) => {
        setBusinesses(data.data);
        fetchBrandAdAccounts(data.data, accessToken);
      })
      .catch((error) => {
        console.error('Error fetching businesses:', error);
      });
  };

  // Fetch Brand Ad Accounts
  const fetchBrandAdAccounts = (businesses, accessToken) => {
    const adAccountPromises = businesses.map((business) => {
      const brandAdAccountUrl = `https://graph.facebook.com/v22.0/${business.id}/owned_ad_accounts?fields=id,name&access_token=${accessToken}`;

      return fetch(brandAdAccountUrl)
        .then((response) => response.json())
        .then((data) => ({
          businessId: business.id,
          businessName: business.name,
          accounts: data.data
        }));
    });

    Promise.all(adAccountPromises)
      .then((results) => {
        const processedAdAccounts = results.flatMap(result => 
          result.accounts.map(account => ({
            ...account,
            businessId: result.businessId,
            businessName: result.businessName
          }))
        );
        setAdAccounts(processedAdAccounts);
      })
      .catch((error) => {
        console.error('Error fetching brand ad accounts:', error);
      });
  };

  // Handle Business Visibility Toggle
  const handleBusinessToggle = (businessId) => {
    setVisibleBusinesses(prev => ({
      ...prev,
      [businessId]: !prev[businessId]
    }));
  };

  // Handle Ad Account Selection
  const handleAdAccountSelect = (adAccountId) => {
    setSelectedAdAccounts(prev => 
      prev.includes(adAccountId)
        ? prev.filter(id => id !== adAccountId)
        : [...prev, adAccountId]
    );
  };

  return (
    <div className="flex">
      {/* Sidebar */}
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
            Brands & Ad Accounts
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 ml-64">
        <button
          className="bg-blue-500 text-white py-2 px-4 rounded-lg mb-6 transition duration-300 hover:bg-blue-600"
          onClick={loginWithAdsPermission}
        >
          Connect with Facebook
        </button>

        {userData && selectedSection === 'userInfo' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">User Info:</h2>
            <p><strong>ID:</strong> {userData.id}</p>
            <p><strong>Name:</strong> {userData.name}</p>
            <p><strong>Email:</strong> {userData.email}</p>
          </div>
        )}

        {selectedSection === 'businessInfo' && (
          <div>
            <h3 className="text-lg font-semibold text-orange-600">Brands & Ad Accounts:</h3>
            <ul className="space-y-4">
              {businesses.map((business) => {
                const businessAdAccounts = adAccounts.filter(
                  account => account.businessId === business.id
                );

                return (
                  <li key={business.id} className="border p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        checked={!!visibleBusinesses[business.id]}
                        onChange={() => handleBusinessToggle(business.id)}
                        className="mr-2"
                      />
                      <h4 className="font-bold text-blue-600">Brand: {business.name}</h4>
                    </div>

                    {visibleBusinesses[business.id] && businessAdAccounts.length > 0 && (
                      <ul className="pl-6 space-y-2">
                        {businessAdAccounts.map((account) => (
                          <li 
                            key={account.id} 
                            className="flex items-center text-gray-700"
                          >
                            <input
                              type="checkbox"
                              checked={selectedAdAccounts.includes(account.id)}
                              onChange={() => handleAdAccountSelect(account.id)}
                              className="mr-2"
                            />
                            Ad account: {account.name}
                          </li>
                        ))}
                      </ul>
                    )}

                    {visibleBusinesses[business.id] && businessAdAccounts.length === 0 && (
                      <p className="text-gray-500 pl-6">No ad accounts found for this brand</p>
                    )}
                  </li>
                );
              })}
            </ul>

            {selectedAdAccounts.length > 0 && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-700">Selected Ad Accounts:</h4>
                <ul className="list-disc pl-5">
                  {selectedAdAccounts.map(accountId => {
                    const account = adAccounts.find(a => a.id === accountId);
                    return (
                      <li key={accountId}>
                        {account ? account.name : 'Unknown Account'}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        )}

        {error && <p className="text-red-500">{error}</p>}
      </div>
    </div>
  );
};

export default Login;
