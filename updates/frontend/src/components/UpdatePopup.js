import React, { useEffect, useState } from "react";

const UpdatePopup = ({ customerId }) => {
  const [showPopup, setShowPopup] = useState(false);
  const [updateType, setUpdateType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const checkForUpdate = async () => {
      if (!customerId) {
        console.error("Customer ID is undefined");
        return; // कस्टमर ID नहीं है तो कुछ न करें
      }

      try {
        const res = await fetch(`https://crm-based-cms-backend.onrender.com/api/ota/check-update-status?customerId=${customerId}`);
        
        if (!res.ok) {
          console.error(`API error: ${res.status} ${res.statusText}`);
          return;
        }
        
        const data = await res.json();
        if (data.updateAvailable) {
          setShowPopup(true);
          setUpdateType(data.updateType);
        }
      } catch (err) {
        console.error("Failed to check for updates:", err);
      }
    };

    checkForUpdate();
  }, [customerId]); // customerId पर निर्भरता

  const handleUpdateNow = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://crm-based-cms-backend.onrender.com/api/ota/push-update`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ customerId, updateType }),
        }
      );

      const data = await res.json();
      if (res.ok) {
        setMessage("✅ Update applied successfully.");
        setShowPopup(false);
      } else {
        setMessage(`❌ Error: ${data.error || "Update failed"}`);
      }
    } catch (err) {
      setMessage("❌ Network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (!showPopup) return null; // यदि पॉपअप नहीं दिखाना है तो कुछ न दिखाएं

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white p-6 rounded-xl shadow-lg w-[90%] max-w-md text-center">
        <h2 className="text-xl font-semibold mb-3">New Update Available</h2>
        <p className="mb-4 capitalize">Update type: {updateType}</p>
        <button
          onClick={handleUpdateNow}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
        >
          {loading ? "Updating..." : "Update Now"}
        </button>
        {message && <p className="mt-3 text-sm text-gray-700">{message}</p>}
      </div>
    </div>
  );
};

export default UpdatePopup;