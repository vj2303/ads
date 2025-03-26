import React, { useState, useEffect } from 'react';

const Login = () => {
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [adAccounts, setAdAccounts] = useState([]); // New state for brand ad accounts
  const [selectedSection, setSelectedSection] = useState('userInfo'); // New state to track selected section
  const [visibleAdAccounts, setVisibleAdAccounts] = useState({});



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
    }, { scope: 'ads_read, business_management', return_scopes: true });
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
    const businessesUrl = `https://graph.facebook.com/v19.0/me/businesses?fields=id,name&limit=100&access_token=${accessToken}`;

    fetch(businessesUrl)
      .then((response) => response.json())
      .then((data) => {
        setBusinesses(data.data); // Set the list of businesses (brand names)
        fetchBrandAdAccounts(data.data, accessToken); // Fetch ad accounts for each business
      })
      .catch((error) => {
        console.error('Error fetching businesses:', error);
      });
  };

  // Fetch brand ad accounts for each business
  const fetchBrandAdAccounts = (businesses, accessToken) => {
    businesses.forEach((business) => {
      const brandAdAccountUrl = `https://graph.facebook.com/v22.0/${business.id}/owned_ad_accounts?fields=id,name&access_token=${accessToken}`;

      fetch(brandAdAccountUrl)
        .then((response) => response.json())
        .then((data) => {
          setAdAccounts((prevAccounts) => [
            ...prevAccounts,
            ...data.data,
          ]);
        })
        .catch((error) => {
          console.error('Error fetching brand ad accounts:', error);
        });
    });
  };

  // Function to fetch ad account details
  const fetchAdAccountDetails = (adAccounts, accessToken) => {
    adAccounts.forEach((adAccount) => {
      const adAccountUrl = `https://graph.facebook.com/v22.0/${adAccount.id}?fields=name,account_id,business&access_token=${accessToken}`;

      fetch(adAccountUrl)
        .then((response) => response.json())
        .then((adAccountData) => {
          adAccount.name = adAccountData.name;
          adAccount.account_name = adAccountData.account_id;
          adAccount.business_id = adAccountData.business?.id;

          // Update user data with ad account details and associated brand
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

  const handleBusinessToggle = (businessId) => {
    setVisibleAdAccounts((prev) => ({
      ...prev,
      [businessId]: !prev[businessId], // Toggle the visibility of ad accounts
    }));
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
            Brands
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
    <h3 className="text-lg font-semibold text-orange-600">Brands:</h3>

    <ul>
  {businesses.map((business) => (
    <li key={business.id} className="flex gap-8 items-center mb-2">
      <div className="flex items-center">
        <input
          type="checkbox"
          checked={visibleAdAccounts[business.id] || false} // Check if this business's ad accounts should be visible
          onChange={() => handleBusinessToggle(business.id)} // Toggle the visibility when clicked
          className="mr-2"
        />
        <span>{business.name}</span>
      </div>

      {/* Show ad accounts for the selected business */}
      {visibleAdAccounts[business.id] && (
        <div className="ml-1 mt-1 border p-2 border-gray-200 rounded-lg">  {/* Reduced margin */}
          <h4 className="font-semibold text-orange-500">Ad Accounts:</h4>
          <ul>
            {adAccounts.map((adAccount) => (
              <li key={adAccount.id}>{adAccount.name}</li> // Show all ad accounts (no filter)
            ))}
          </ul>
        </div>
      )}
    </li>
  ))}
</ul>


     
  </div>
)}


        {error && <p className="text-red-500">{error}</p>}
      </div>
      
    </div>
  );
};

export default Login;
