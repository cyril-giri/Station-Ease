import React, { useContext, useEffect } from 'react';
import myContext from '../../context/data/myContext';
import Layout from '../../components/layout/Layout';
import Loader from '../../components/loader/Loader';
import { updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { fireDB } from '../../firebase/FirebaseConfig';
import { toast } from 'react-toastify';

function Order() {
  const userid = JSON.parse(localStorage.getItem('user')).user.uid;
  const context = useContext(myContext);
  const { mode, loading, order, printReq } = context;

  // Filter orders based on userid
  const userOrders = order.filter(order => order.userid === userid);
  const userPrintReq = printReq.filter(printReq => printReq.userId === userid);

  // Filter user orders based on whether they are fulfilled or not
  const pendingOrders = userOrders.filter(order => !order.orderFullFilled);
  const fulfilledOrders = userOrders.filter(order => order.orderFullFilled);

  const pendingPrintReq = userPrintReq.filter(order => !order.orderFullFilled);
  const fulfilledPrintReq = userPrintReq.filter(order => order.orderFullFilled);

  // Function to update orderFullFilled attribute to true in the database
  const updateOrderFullFilledInDB = async (paymentId) => {
    try {
      const ordersRef = collection(fireDB, 'order');
      const q = query(ordersRef, where("paymentId", "==", paymentId));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const orderDoc = querySnapshot.docs[0];
        await updateDoc(orderDoc.ref, {
          orderFullFilled: true
        });
        console.log('Order updated successfully in the database');
        toast.success('Order collected');
      } else {
        console.log('No orders found with the specified paymentId:', paymentId);
      }
    } catch (error) {
      console.error('Error updating order in the database:', error);
      throw error;
    }
  };

  // Function to update print orderFullFilled attribute to true in the database
  const updatePrintOrderFullFilled = async (paymentId) => {
    try {
      const printReqRef = collection(fireDB, 'printreq');
      const q = query(printReqRef, where("paymentId", "==", paymentId));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const printReqDoc = querySnapshot.docs[0];
        await updateDoc(printReqDoc.ref, {
          orderFullFilled: true
        });
        console.log('Print request updated successfully in the database');
        toast.success('Order collected');
      } else {
        console.log('No print request found with the specified paymentId:', paymentId);
      }
    } catch (error) {
      console.error('Error updating print request in the database:', error);
      throw error;
    }
  };

  // Function to update UI after order fulfillment
  const updateUIAfterOrderFulfillment = (orderId) => {
    // Call any function or set any state to update the UI as needed
    console.log('UI updated after order fulfillment:', orderId);
  };

  return (
    <Layout>
      {loading && <Loader />}
      <div className="h-full pt-10">
        {/* Display orders to be fulfilled */}
        {pendingOrders.length > 0 && (
          <>
            <h2 className="text-2xl font-bold mb-4 text-center" style={{ color: mode === 'dark' ? 'white' : '' }}>Orders to be Fulfilled</h2>
            <div className="mx-auto max-w-5xl justify-center px-6 md:flex md:space-x-6 xl:px-0">
              {pendingOrders.map(order => (
                <OrderItem key={order.id} order={order} mode={mode} updateOrderFullFilled={(orderId) => {
                  updateOrderFullFilledInDB(orderId)
                    .then(() => updateUIAfterOrderFulfillment(orderId))
                    .catch((error) => console.error(error));
                }} />
              ))}
            </div>
          </>
        )}

        {/* Display fulfilled orders */}
        {fulfilledOrders.length > 0 && (
          <>
            <h2 className="text-2xl font-bold mb-4 text-center" style={{ color: mode === 'dark' ? 'white' : '' }}>Fulfilled Orders</h2>
            <div className="mx-auto max-w-5xl justify-center px-6 md:flex md:space-x-6 xl:px-0" style={{ flexDirection: 'column', alignItems: 'center' }}>
              {fulfilledOrders.map(order => (
                <OrderItem key={order.id} order={order} mode={mode} />
              ))}
            </div>
          </>
        )}

        {/* Display pending print requests */}
        {pendingPrintReq.length > 0 && (
          <>
            <h2 className="text-2xl font-bold mb-4 text-center" style={{ color: mode === 'dark' ? 'white' : '' }}>Print Requests to be Fulfilled</h2>
            <div className="mx-auto max-w-5xl justify-center px-6 md:flex md:space-x-6 xl:px-0">
              {pendingPrintReq.map(req => (
                <PrintRequestItem key={req.id} request={req} mode={mode} updatePrintOrderFullFilled={updatePrintOrderFullFilled} />
              ))}
            </div>
          </>
        )}

        {/* Display fulfilled print requests */}
        {fulfilledPrintReq.length > 0 && (
          <>
            <h2 className="text-2xl font-bold mb-4 text-center" style={{ color: mode === 'dark' ? 'white' : '' }}>Fulfilled Print Requests</h2>
            <div className="mx-auto max-w-5xl justify-center px-6 md:flex md:space-x-6 xl:px-0" style={{ flexDirection: 'column', alignItems: 'center' }}>
              {fulfilledPrintReq.map(req => (
                <PrintRequestItem key={req.id} request={req} mode={mode} />
              ))}
            </div>
          </>
        )}

        {/* Display message if no orders */}
        {pendingOrders.length === 0 && fulfilledOrders.length === 0 && (
          <h2 className="text-2xl font-bold mb-4 text-center text-white">No Orders</h2>
        )}
      </div>
    </Layout>
  );
}

// Extract OrderItem as a separate component
function OrderItem({ order, mode, updateOrderFullFilled }) {
  const handleFulfillOrder = () => {
    // Update orderFullFilled attribute to true in the database
    // Call the function to update UI
    updateOrderFullFilled(order.paymentId);
  };

  return (
    <div className="rounded-lg md:w-2/3">
      <div className="justify-between mb-6 rounded-lg bg-white p-6 shadow-md sm:flex sm:justify-start" style={{ backgroundColor: mode === 'dark' ? '#282c34' : '', color: mode === 'dark' ? 'white' : '' }}>
        {order.cartItems.map(item => (
          <div key={item} className="sm:ml-4 sm:flex sm:w-full sm:justify-between">
            <div className="mt-5 sm:mt-0">
              <img src={item.imageUrl} alt="Product" className="w-24 h-24 object-cover rounded-lg mr-4 sm:float-left" />
              <div>
                <h2 className="text-lg font-bold text-gray-900" style={{ color: mode === 'dark' ? 'white' : '' }}>{item.title}</h2>
                <p className="mt-1 text-xs text-gray-700" style={{ color: mode === 'dark' ? 'white' : '' }}>{item.description}</p>
                <h2 className="text-lg font-bold text-gray-900" style={{ color: mode === 'dark' ? 'white' : '', paddingTop: '10px' }}>Rs. {item.price}</h2>
              </div>
            </div>
            {!order.orderFullFilled && (
              <button className="ml-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={handleFulfillOrder}>
                Order Collected
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PrintRequestItem({ request, mode, updatePrintOrderFullFilled }) {
  const handleOrderCollected = () => {
    // Implement the functionality to mark the print request as collected
    updatePrintOrderFullFilled(request.paymentId);
  };

  return (
    <div className="rounded-lg md:w-2/3">
      <div className="justify-between mb-6 rounded-lg bg-white p-6 shadow-md sm:flex sm:justify-start" style={{ backgroundColor: mode === 'dark' ? '#282c34' : '', color: mode === 'dark' ? 'white' : '' }}>
        <div className="mt-5 sm:mt-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900" style={{ color: mode === 'dark' ? 'white' : '' }}>
              <a href={request.downloadURL} target="_blank" rel="noopener noreferrer">{request.filename}</a>
            </h2>
            <p className="mt-1 text-xs text-gray-700" style={{ color: mode === 'dark' ? 'white' : '' }}>Number of Pages: {request.numPages}</p>
            <p className="mt-1 text-xs text-gray-700" style={{ color: mode === 'dark' ? 'white' : '' }}>Page Color: {request.pageColor}</p>
            <p className="mt-1 text-xs text-gray-700" style={{ color: mode === 'dark' ? 'white' : '' }}>Page Layout: {request.pageLayout}</p>
            <p className="mt-1 text-xs text-gray-700" style={{ color: mode === 'dark' ? 'white' : '' }}>Page Orientation: {request.pageOrientation}</p>
            {/* Add any additional details you want to display */}
          </div>
        </div>
        {!request.orderFullFilled && (
          <button className="ml-auto bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={handleOrderCollected}>
            Order Collected
          </button>
        )}
      </div>
    </div>
  );
}

export default Order;

