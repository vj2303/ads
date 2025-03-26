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

  // Function to handle Save
  const handleSave = () => {
    if (!selectedBusinessId || adAccounts.length === 0) {
      alert('Please select a business and at least one ad account.');
      return;
    }

    const selectedAdAccounts = adAccounts.filter(account => account.selected).map(account => account.id);

    if (selectedAdAccounts.length === 0) {
      alert('No ad accounts selected.');
      return;
    }

    // Send the selected Ad Accounts to the backend
    fetch('http://localhost:5004/api/saveAdAccounts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        businessId: selectedBusinessId,
        adAccounts: selectedAdAccounts,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log('Save successful:', data);
        alert('Ad Accounts saved successfully!');
      })
      .catch((error) => {
        console.error('Error saving data:', error);
        alert('Error saving ad accounts.');
      });
  };

  // Login with Facebook Ads permissions
  const loginWithAdsPermission = () => {
    FB.login(function (response) {
      if (response.authResponse) {
        const accessToken = response.authResponse.accessToken;
        fetchUserData(accessToken);
        fetchBusinesses(accessToken);
        alert('Login successful!'); // Alert after successful login
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
        alert('User data fetched successfully!'); // Alert after successful user data fetch
      })
      .catch((error) => {
        setError('Error fetching data');
        console.error(error);
        alert('Error fetching user data');
      });
  };

  // Fetch Businesses (brand names)
  const fetchBusinesses = (accessToken) => {
    const businessesUrl = `https://graph.facebook.com/v19.0/me/businesses?fields=id,name&limit=100&access_token=${accessToken}`;

    fetch(businessesUrl)
      .then((response) => response.json())
      .then((data) => {
        setBusinesses(data.data);
        alert('Businesses fetched successfully!'); // Alert after successful businesses fetch
      })
      .catch((error) => {
        console.error('Error fetching businesses:', error);
        alert('Error fetching businesses');
      });
  };

  // Fetch Ad Accounts for a selected business
  const fetchAdAccounts = (businessId, accessToken) => {
    
    const brandAdAccountUrl = `https://graph.facebook.com/v22.0/${businessId}/owned_ad_accounts?fields=id,name&access_token=${accessToken}`;

    fetch(brandAdAccountUrl)
      .then((response) => response.json())
      .then((data) => {
        setAdAccounts(data.data); // Update ad accounts state
        alert('Ad accounts fetched successfully!'); // Alert after successful ad account fetch
      })
      .catch((error) => {
        console.error('Error fetching brand ad accounts:', error);
        alert('Error fetching ad accounts');
      });
  };

  const handleBusinessSelection = (businessId) => {
    setSelectedBusinessId((prevId) => (prevId === businessId ? null : businessId));

    // Fetch Ad Accounts for the selected business
    if (userData && userData.accessToken) {
      fetchAdAccounts(businessId, userData.accessToken);
    } else {
      alert('Access token missing. Please log in again.');
    }
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
            <div className=''>
              <h3 className="text-lg text-orange-500 mb-8">Brands:</h3>
              <div className='flex gap-4'>
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

                <ul className='bg-gray-100 rounded-2xl p-2 mr-2'>
                  {selectedBusinessId && (
                    <div className="mt-2 ml-6 p-6">
                      <h4 className="text-lg text-blue-500 mb-2">Ad Accounts:</h4>
                      {adAccounts && adAccounts.map((account) => (
                        <p key={account.id} className="text-sm flex flex-row">
                          <input
                            type="checkbox"
                            className="mr-3"
                            onChange={() => {
                              account.selected = !account.selected;
                              setAdAccounts([...adAccounts]);
                            }}
                          />
                          {account.name}
                        </p>
                      ))}
                    </div>
                  )}
                </ul>
              </div>
              <button
                className="text-white rounded-xl cursor-pointer bg-blue-600 px-8 py-2"
                onClick={handleSave}
              >
                Save
              </button>
            </div>
          )}

          {error && <p className="text-red-500">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
