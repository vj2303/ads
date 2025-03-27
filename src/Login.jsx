import axios from 'axios';
import React, { useState, useEffect } from 'react';

const Login = () => {
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [adAccounts, setAdAccounts] = useState([]);
  const [selectedSection, setSelectedSection] = useState('userInfo');
  
  // State to manage selected brands and ad accounts
  const [selectedBusinesses, setSelectedBusinesses] = useState({});
  const [selectedAdAccounts, setSelectedAdAccounts] = useState({});

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

  // Handle Brand Selection
  const handleBusinessSelect = (businessId) => {
    setSelectedBusinesses(prev => ({
      ...prev,
      [businessId]: !prev[businessId]
    }));

    // If business is deselected, remove its ad accounts from selection
    if (!selectedBusinesses[businessId]) {
      const businessAdAccounts = adAccounts
        .filter(account => account.businessId === businessId)
        .map(account => account.id);
      
      const updatedSelectedAdAccounts = {...selectedAdAccounts};
      businessAdAccounts.forEach(accountId => {
        delete updatedSelectedAdAccounts[accountId];
      });
      
      setSelectedAdAccounts(updatedSelectedAdAccounts);
    }
  };

  // Handle Ad Account Selection
  const handleAdAccountSelect = (adAccountId, businessId) => {
    setSelectedAdAccounts(prev => ({
      ...prev,
      [adAccountId]: !prev[adAccountId]
    }));

    // Automatically select/deselect the business when all its ad accounts are selected/deselected
    const businessAdAccounts = adAccounts
      .filter(account => account.businessId === businessId)
      .map(account => account.id);
    
    const allSelected = businessAdAccounts.every(
      accountId => (accountId === adAccountId ? !prev[accountId] : prev[accountId])
    );

    setSelectedBusinesses(prev => ({
      ...prev,
      [businessId]: allSelected
    }));
  };

  // Save Selected Accounts
  const handleSaveAccount = async () => {
    if (!userData || !userData.id) {
      alert('User data is not available. Please log in again.');
      return;
    }

    // Create accounts payload from selected ad accounts
    const accountsPayload = {
      id: userData.id,
      accounts: Object.keys(selectedAdAccounts)
        .filter(accountId => selectedAdAccounts[accountId])
        .map(accountId => {
          const account = adAccounts.find(a => a.id === accountId);
          return {
            name: account.businessName,
            adAccount: account.id
          };
        })
    };

    try {
      const res = await axios({
        method: "post",
        url: "https://aads-rho.vercel.app/accounts/",
        data: accountsPayload
      });
      alert("Accounts saved successfully");
    } catch (error) {
      console.error("Error saving accounts:", error);
      alert("Could not save the accounts");
    }
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
                        checked={!!selectedBusinesses[business.id]}
                        onChange={() => handleBusinessSelect(business.id)}
                        className="mr-2"
                      />
                      <h4 className="font-bold text-blue-600">Brand: {business.name}</h4>
                    </div>

                    {businessAdAccounts.length > 0 && (
                      <ul className="pl-6 space-y-2">
                        {businessAdAccounts.map((account) => (
                          <li
                            key={account.id}
                            className="flex items-center text-gray-700"
                          >
                            <input
                              type="checkbox"
                              checked={!!selectedAdAccounts[account.id]}
                              onChange={() => handleAdAccountSelect(account.id, business.id)}
                              className="mr-2"
                            />
                            Ad account: {account.name}
                          </li>
                        ))}
                      </ul>
                    )}

                    {businessAdAccounts.length === 0 && (
                      <p className="text-gray-500 pl-6">No ad accounts found for this brand</p>
                    )}
                  </li>
                );
              })}
            </ul>

            {Object.keys(selectedAdAccounts).filter(accountId => selectedAdAccounts[accountId]).length > 0 && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-700">Selected Ad Accounts:</h4>
                <ul className="list-disc pl-5">
                  {Object.keys(selectedAdAccounts)
                    .filter(accountId => selectedAdAccounts[accountId])
                    .map(accountId => {
                      const account = adAccounts.find(a => a.id === accountId);
                      return (
                        <li key={accountId}>
                          {account ? `${account.name} (${account.businessName})` : 'Unknown Account'}
                        </li>
                      );
                    })}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className='flex gap-4 mt-4'>
          <button 
            className='bg-blue-600 px-4 py-2 cursor-pointer text-white rounded-xl' 
            onClick={handleSaveAccount}
            disabled={Object.keys(selectedAdAccounts).filter(accountId => selectedAdAccounts[accountId]).length === 0}
          >
            Save Selected Accounts
          </button>
          <button 
            className='bg-blue-600 px-4 py-2 cursor-pointer text-white rounded-xl'
          >
            Remove
          </button>
        </div>

        {error && <p className="text-red-500">{error}</p>}
      </div>
    </div>
  );
};

export default Login;
