import React, { useEffect, useState } from "react";
import axios from "axios";
import "../src/assets/OrdersPage.css";
import "./assets/Admin.css";
import { link } from "../public/address";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";

function AdminOrders() {
  let [orders, setOrders] = useState([]);
  const history = useHistory();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get(`${link}/admin/orders`);
        if (response.status === 200) {
          setOrders(Array.isArray(response.data) ? response.data : response.data.orders || []);
        } else {
          console.log("Failed to fetch orders:", response);
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
      }
    };

    fetchOrders();
  }, []);

  const handleStatusChange = async (e, orderId) => {
    const selectedStatus = e.target.value;
    try {
        const response = await axios.post(`${link}/admin/order/update`, {orderId:orderId, status:selectedStatus});
        if (response.status === 200) {
            console.log("Order updated:", response.data);
            // Refresh orders after update
            const updatedOrders = orders.map(order => 
              order._id === orderId ? {...order, Status: selectedStatus} : order
            );
            setOrders(updatedOrders);
          }
        } catch (error) {
          console.log("Error updating order:", error);
        }
  };
  const handleClick = (orderId) => {
    history.push(`/orders/${orderId}`)
  };
  return (
    <div className="centered-div">
      <div className="data-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Phone</th> 
              <th>Address</th>
              <th>Status</th>
              <th>Placed At</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order._id}>
                <td className={`order-id ${order.Status === "Delivered" ? "strike" : ""}`} onClick={() => handleClick(order._id)}>{order._id}</td>
                <td>{order.Phone}</td>
                <td>{order.Address}</td>
                <td>
                  <select
                    name="status"
                    id="status"
                    defaultValue={order.Status}
                    onChange={(e) => handleStatusChange(e, order._id)}
                  >
                    <option value="Order Placed">Order Placed</option>
                    <option value="Preparing">Preparing</option>
                    <option value="Ready for Pickup">Ready for Pickup</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </td>
                <td>{order.Ordered_Time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminOrders;
