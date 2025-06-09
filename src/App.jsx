import React, { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from 'react-router-dom';

import Home from './pages/home/Home';
import Order from './pages/order/Order';
import Cart from './pages/cart/Cart';
import Dashboard from './pages/admin/dashboard/Dashboard';
import NoPage from './pages/nopage/NoPage';
import MyState from './context/data/myState';
import Login from './pages/registration/Login';
import SignUp from './pages/registration/SignUp';
import ProductInfo from './pages/productInfo/Productinfo';
import Addproduct from './pages/admin/pages/AddProduct';
import UpdateProduct from './pages/admin/pages/UpdateProduct';
import { ToastContainer } from 'react-toastify';
import Allproducts from './pages/allproducts/AllProducts';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

function App() {
  useEffect(() => {
    const messaging = getMessaging();
    Notification.requestPermission()
      .then((permission) => {
        if (permission === 'granted') {
          console.log('Notification permission granted.');
          getToken(messaging, {
            vapidKey: 'BFjKFinC0FBao5FQ739u7DFIIeVQ6mkK_PM5EMOxr_hii_1VJxggvdlJhIeQnaC75plr1AVgKRJQvfkxocpRniA',
          })
            .then((currentToken) => {
              if (currentToken) {
                console.log('FCM token:', currentToken);
                // You can now use the token as needed, such as sending it to your server
              } else {
                console.log('No registration token available.');
              }
            })
            .catch((error) => {
              console.error('Error getting FCM token:', error);
            });
        } else {
          console.log('Unable to get permission to notify.');
        }
      })
      .catch((error) => {
        console.error('Error requesting permission:', error);
      });
  }, []);

  useEffect(() => {
    // Listen for incoming messages
    const messaging = getMessaging(); // Retrieve messaging instance
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Message received:', payload);
      // Perform custom actions based on the received message
      // For example, display a notification, update UI, etc.
    });

    return () => {
      // Clean up the subscription when component unmounts
      unsubscribe();
    };
  }, []);

  return (
    <MyState>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/allproducts" element={<Allproducts />} />
          <Route path="/order" element={<ProtectedRoutes><Order /></ProtectedRoutes>} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/dashboard" element={<ProtectedRoutesForAdmin><Dashboard /></ProtectedRoutesForAdmin>} />
          <Route path="/productinfo/:id" element={<ProductInfo />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/addproduct" element={<ProtectedRoutesForAdmin><Addproduct /></ProtectedRoutesForAdmin>} />
          <Route path="/updateproduct" element={<ProtectedRoutesForAdmin><UpdateProduct /></ProtectedRoutesForAdmin>} />
          <Route path="/*" element={<NoPage />} />
        </Routes>
        <ToastContainer />
      </Router>
    </MyState>
  );
}

export default App;

export const ProtectedRoutes = ({ children }) => {
  if (localStorage.getItem('user')) {
    return children;
  } else {
    return <Navigate to={'/login'} />;
  }
};

export const ProtectedRoutesForAdmin = ({ children }) => {
  const admin = JSON.parse(localStorage.getItem('user'));
  console.log(admin.user.email);
  if (admin.user.email === 'admin@gmail.com') {
    return children;
  } else {
    return <Navigate to={'/login'} />;
  }
};
